<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Notifications\MentionNotification;
use App\Notifications\NewRepostNotification;
use App\Notifications\NewWallPostNotification;

class PostService
{
    public function __construct(protected FileStorageService $fileService)
    {
    }

    /**
     * Створення нового посту.
     */
    public function createPost(User $user, array $data, ?array $mediaFiles): array|Post
    {
        $targetUserId = $data['target_user_id'] ?? null;
        $originalPostId = $data['original_post_id'] ?? null;
        $entities = $data['entities'] ?? null;

        // Перевіряємо опитування перед створенням посту
        $pollValidation = $this->validatePoll($entities);
        if (is_array($pollValidation))
        {
            return $pollValidation;
        }

        $post = $user->posts()->create([
            'target_user_id' => $targetUserId == $user->id ? null : $targetUserId,
            'content' => $data['content'] ?? null,
            'entities' => $entities,
            'original_post_id' => $originalPostId,
            'is_repost' => (bool)$originalPostId
        ]);

        $this->handleMentions($post, $user, $targetUserId);
        $this->handleNotifications($post, $user, $targetUserId, $originalPostId);

        if (!empty($mediaFiles))
        {
            $this->uploadMedia($post, $user->username, $mediaFiles);
        }

        return $post;
    }

    /**
     * Оновлення посту (Текст, Медіа, Опитування).
     */
    public function updatePost(Post $post, array $data, ?array $newMedia, ?array $deletedMediaIds): array|Post
    {
        $currentMediaCount = $post->attachments()->count();
        $deletedMediaCount = !empty($deletedMediaIds) ? count($deletedMediaIds) : 0;
        $newMediaCount = !empty($newMedia) ? count($newMedia) : 0;

        if (($currentMediaCount - $deletedMediaCount + $newMediaCount) > 10)
        {
            return [
                'error' => 'ERR_MAX_MEDIA_EXCEEDED',
                'message' => 'A post cannot have more than 10 media attachments.',
                'status' => 422
            ];
        }

        $updateData = [];

        if (array_key_exists('content', $data))
        {
            $updateData['content'] = $data['content'];
        }

        if (array_key_exists('entities', $data))
        {
            $newEntities = $data['entities'] ?? [];

            // Забороняємо видаляти старе опитування при редагуванні
            if (isset($post->entities['poll']))
            {
                $newEntities['poll'] = $post->entities['poll'];
            }

            $updateData['entities'] = empty($newEntities) ? null : $newEntities;
        }

        if (!empty($updateData))
        {
            $post->update($updateData);
        }

        // Видалення старих медіа
        if (!empty($deletedMediaIds))
        {
            $attachmentsToDelete = $post->attachments()->whereIn('id', $deletedMediaIds)->get();
            foreach ($attachmentsToDelete as $attachment)
            {
                $this->fileService->delete($attachment->file_path);
                $attachment->delete();
            }
        }

        // Завантаження нових медіа
        if (!empty($newMedia))
        {
            $this->uploadMedia($post, $post->user->username, $newMedia);
        }

        return $post;
    }

    /**
     * Повне видалення посту разом із файлами.
     */
    public function deletePost(Post $post): void
    {
        $attachments = $post->attachments;
        foreach ($attachments as $attachment)
        {
            $this->fileService->delete($attachment->file_path);
        }
        $post->delete();
    }

    /**
     * Валідація структури опитування.
     */
    private function validatePoll(?array $entities): bool|array
    {
        if (!isset($entities['poll']))
        {
            return true;
        }

        $poll = $entities['poll'];

        if (empty(trim($poll['question'] ?? '')))
        {
            return ['error' => 'ERR_POLL_QUESTION_EMPTY', 'message' => 'Poll question cannot be empty.', 'status' => 422];
        }

        if (!isset($poll['options']) || !is_array($poll['options']))
        {
            return ['error' => 'ERR_POLL_OPTIONS_INVALID', 'message' => 'Poll options must be a valid array.', 'status' => 422];
        }

        $optionsCount = count($poll['options']);
        if ($optionsCount < 2 || $optionsCount > 10)
        {
            return ['error' => 'ERR_POLL_OPTIONS_LIMIT', 'message' => 'Poll must have between 2 and 10 options.', 'status' => 422];
        }

        $hasCorrectOption = false;
        foreach ($poll['options'] as $option)
        {
            if (empty(trim($option['text'] ?? '')))
            {
                return ['error' => 'ERR_POLL_OPTION_EMPTY', 'message' => 'Poll options cannot be empty.', 'status' => 422];
            }
            if (!empty($option['is_correct']))
            {
                $hasCorrectOption = true;
            }
        }

        if (($poll['type'] ?? 'regular') === 'quiz' && !$hasCorrectOption)
        {
            return ['error' => 'ERR_QUIZ_NO_CORRECT_OPTION', 'message' => 'Quiz must have at least one correct option.', 'status' => 422];
        }

        return true;
    }

    /**
     * Завантаження масиву файлів до посту.
     */
    private function uploadMedia(Post $post, string $username, array $mediaFiles): void
    {
        $lastOrder = $post->attachments()->max('sort_order') ?? -1;

        foreach ($mediaFiles as $index => $file)
        {
            $mime = $file->getMimeType();
            $type = str_starts_with($mime, 'image/') ? 'image' :
                (str_starts_with($mime, 'video/') ? 'video' :
                    (str_starts_with($mime, 'audio/') ? 'audio' : 'document'));

            $path = $this->fileService->upload($file, $username, 'media');

            $post->attachments()->create([
                'type' => $type,
                'file_path' => $path,
                'sort_order' => $lastOrder + 1 + $index,
                'file_name' => basename($path),
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize()
            ]);
        }
    }

    private function handleMentions(Post $post, User $user, ?int $targetUserId): void
    {
        if (empty($post->content) || !is_array($post->content)) return;

        $mentionedUsernames = [];
        $this->extractMentions($post->content, $mentionedUsernames);
        $mentionedUsernames = array_unique($mentionedUsernames);

        if (!empty($mentionedUsernames))
        {
            $mentionedUsers = User::whereIn('username', $mentionedUsernames)->get();
            foreach ($mentionedUsers as $mentionedUser)
            {
                if ($mentionedUser->id !== $user->id && $mentionedUser->id != $targetUserId)
                {
                    $mentionedUser->notify(new MentionNotification($user, $post));
                }
            }
        }
    }

    private function extractMentions(array $node, array &$usernames): void
    {
        if (isset($node['type']) && $node['type'] === 'mention' && isset($node['attrs']['username']))
        {
            $usernames[] = $node['attrs']['username'];
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            foreach ($node['content'] as $child)
            {
                if (is_array($child))
                {
                    $this->extractMentions($child, $usernames);
                }
            }
        }
    }

    private function handleNotifications(Post $post, User $user, ?int $targetUserId, ?string $originalPostId): void
    {
        if ($targetUserId && $targetUserId != $user->id)
        {
            $targetUser = User::find($targetUserId);
            if ($targetUser)
            {
                $prefs = $targetUser->getNotificationPreferencesFor($user->id, 'wall_posts');
                if ($prefs['should_notify'])
                {
                    $targetUser->notify(new NewWallPostNotification($user, $post, $prefs['sound']));
                }
            }
        }

        if ($originalPostId)
        {
            $originalPost = Post::find($originalPostId);
            if ($originalPost && $originalPost->user_id !== $user->id)
            {
                $alreadyNotified = $originalPost->user->notifications()
                    ->where('type', NewRepostNotification::class)
                    ->where('data->user_id', $user->id)
                    ->where('data->post_id', $originalPost->id)
                    ->exists();

                if (!$alreadyNotified)
                {
                    $prefs = $originalPost->user->getNotificationPreferencesFor($user->id, 'reposts');
                    if ($prefs['should_notify'])
                    {
                        $originalPost->user->notify(new NewRepostNotification($user, $originalPost, $prefs['sound']));
                    }
                }
            }
        }
    }
}