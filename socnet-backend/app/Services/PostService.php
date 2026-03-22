<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Notifications\MentionNotification;
use App\Notifications\NewRepostNotification;
use App\Notifications\NewWallPostNotification;
use Illuminate\Support\Facades\Storage;

class PostService
{
    public function __construct(protected FileStorageService $fileService)
    {
    }

    public function createPost(User $user, array $data, ?array $mediaFiles): array|Post
    {
        $targetUserId = $data['target_user_id'] ?? null;
        $originalPostId = $data['original_post_id'] ?? null;
        $entities = $data['entities'] ?? null;

        $pollValidation = $this->validatePoll($entities);
        if ($pollValidation !== true)
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

    public function updatePost(Post $post, array $data, ?array $newMedia, ?array $deletedMediaIds): array|Post
    {
        $currentMediaCount = $post->attachments()->count();
        $deletedMediaCount = $deletedMediaIds ? count($deletedMediaIds) : 0;
        $newMediaCount = $newMedia ? count($newMedia) : 0;

        if (($currentMediaCount - $deletedMediaCount + $newMediaCount) > 10)
        {
            return ['error' => 'ERR_MAX_MEDIA_EXCEEDED', 'message' => 'A post cannot have more than 10 media attachments.', 'status' => 422];
        }

        $updateData = [];
        if (array_key_exists('content', $data)) $updateData['content'] = $data['content'];

        if (array_key_exists('entities', $data))
        {
            $newEntities = $data['entities'];
            if (isset($post->entities['poll']))
            {
                $newEntities['poll'] = $post->entities['poll']; // Зберігаємо старе опитування
            }
            $updateData['entities'] = empty($newEntities) ? null : $newEntities;
        }

        if (!empty($updateData))
        {
            $post->update($updateData);
        }

        if (!empty($deletedMediaIds))
        {
            $attachmentsToDelete = $post->attachments()->whereIn('id', $deletedMediaIds)->get();
            foreach ($attachmentsToDelete as $attachment)
            {
                Storage::disk('public')->delete($attachment->file_path);
                $attachment->delete();
            }
        }

        if (!empty($newMedia))
        {
            $this->uploadMedia($post, $post->user->username, $newMedia);
        }

        return $post;
    }

    public function deletePost(Post $post): void
    {
        $attachments = $post->attachments()->get();
        foreach ($attachments as $attachment)
        {
            Storage::disk('public')->delete($attachment->file_path);
        }
        $post->delete();
    }

    private function validatePoll(?array $entities): bool|array
    {
        if (!isset($entities['poll'])) return true;

        $poll = $entities['poll'];
        if (empty(trim($poll['question'] ?? '')))
            return [
                'error' => 'ERR_POLL_QUESTION_EMPTY',
                'message' => 'Poll question cannot be empty.',
                'status' => 422
            ];

        if (!isset($poll['options']) || !is_array($poll['options']))
            return [
                'error' => 'ERR_POLL_OPTIONS_INVALID',
                'message' => 'Poll options must be a valid array.',
                'status' => 422
            ];

        $optionsCount = count($poll['options']);
        if ($optionsCount < 2 || $optionsCount > 16)
            return [
                'error' => 'ERR_POLL_OPTIONS_LIMIT',
                'message' => 'Poll must have between 2 and 16 options.',
                'status' => 422
            ];

        $hasCorrectOption = false;
        foreach ($poll['options'] as $option)
        {
            if (empty(trim($option['text'] ?? ''))) return ['error' => 'ERR_POLL_OPTION_EMPTY', 'message' => 'Poll options cannot be empty.', 'status' => 422];
            if (!empty($option['is_correct'])) $hasCorrectOption = true;
        }

        if (($poll['type'] ?? 'regular') === 'quiz')
        {
            if (!$hasCorrectOption) return ['error' => 'ERR_QUIZ_NO_CORRECT_OPTION', 'message' => 'Quiz must have at least one correct option.', 'status' => 422];
            if (isset($poll['explanation']) && mb_strlen($poll['explanation']) > 255) return ['error' => 'ERR_QUIZ_EXPLANATION_TOO_LONG', 'message' => 'Explanation is too long.', 'status' => 422];
        }

        return true;
    }

    private function handleMentions(Post $post, User $user, ?int $targetUserId): void
    {
        if (empty($post->content)) return;

        preg_match_all('/@([a-zA-Z0-9_.]+)/', $post->content, $matches);
        $mentionedUsernames = array_unique($matches[1]);

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

    private function uploadMedia(Post $post, string $username, array $mediaFiles): void
    {
        $lastOrder = $post->attachments()->max('sort_order') ?? -1;

        foreach ($mediaFiles as $index => $file)
        {
            $mime = $file->getMimeType();
            $type = str_starts_with($mime, 'image/') ? 'image' : (str_starts_with($mime, 'video/') ? 'video' : (str_starts_with($mime, 'audio/') ? 'audio' : 'document'));

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
}