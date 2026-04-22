<?php

namespace App\Services;

use App\Enums\PrivacyContext;
use App\Exceptions\ApiException;
use App\Models\Post;
use App\Models\User;
use App\Notifications\MentionNotification;
use App\Notifications\NewRepostNotification;
use App\Notifications\NewWallPostNotification;
use Illuminate\Support\Facades\DB;

class PostService
{
    public const POST_RELATIONS = [
        'user', 'targetUser', 'attachments', 'pollVotes.user', 'myPollVotes',
        // 1-й рівень вкладеності
        'originalPost.user', 'originalPost.attachments', 'originalPost.pollVotes.user', 'originalPost.myPollVotes',
        // 2-й рівень вкладеності
        'originalPost.originalPost.user', 'originalPost.originalPost.attachments', 'originalPost.originalPost.pollVotes.user', 'originalPost.originalPost.myPollVotes',
        // 3-й рівень вкладеності
        'originalPost.originalPost.originalPost.user', 'originalPost.originalPost.originalPost.attachments'
    ];

    public function __construct(protected FileStorageService $fileService)
    {
    }

    /**
     * Отримати пости для стіни з урахуванням приватності
     */
    public function getWallPosts(User $targetUser, ?User $currentUser)
    {
        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $targetUser->id))
        {
            return Post::whereNull('id')->paginate(config('posts.max_paginate', 15));
        }

        if (!app(PrivacyService::class)->canAccess($targetUser, $currentUser, PrivacyContext::Profile->value))
        {
            return Post::whereNull('id')->paginate(config('posts.max_paginate', 15));
        }

        $query = Post::select('posts.*')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->where('users.is_banned', false)
            ->where(function ($q) use ($targetUser)
            {
                $q->where('posts.target_user_id', $targetUser->id)
                    ->orWhere(function ($q2) use ($targetUser)
                    {
                        $q2->where('posts.user_id', $targetUser->id)->whereNull('posts.target_user_id');
                    });
            })
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts']);

        if ($currentUser)
        {
            $query->withExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        }

        return $query->latest('posts.created_at')->paginate(config('posts.max_paginate', 15));
    }

    /**
     * Отримати пости-аватарки з урахуванням приватності
     */
    public function getAvatarPosts(User $targetUser, ?User $currentUser)
    {
        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $targetUser->id))
        {
            return Post::whereNull('id')->paginate(30);
        }

        if (!app(PrivacyService::class)->canAccess($targetUser, $currentUser, PrivacyContext::Avatar->value))
        {
            return Post::whereNull('id')->paginate(30);
        }

        $posts = Post::where('user_id', $targetUser->id)
            ->whereJsonContains('content->is_avatar_update', true)
            ->with(['user', 'targetUser', 'attachments', 'pollVotes', 'myPollVotes', 'originalPost.user', 'originalPost.attachments', 'originalPost.originalPost.user', 'originalPost.originalPost.attachments'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(30);

        if ($currentUser)
        {
            $posts->getCollection()->loadExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        }

        return $posts;
    }

    public function loadPostRelations(Post $post): Post
    {
        $currentUser = auth('sanctum')->user();
        $post->load(self::POST_RELATIONS)->loadCount(['likes', 'comments', 'reposts']);

        if ($currentUser)
        {
            $post->loadExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        } else
        {
            $post->is_liked = false;
        }

        return $post;
    }

    public function createPost(User $user, array $data, ?array $mediaFiles): Post
    {
        return DB::transaction(function () use ($user, $data, $mediaFiles)
        {
            $payload = $data['payload'] ?? [];
            $targetUserId = $data['target_user_id'] ?? null;
            $originalPostId = $data['original_post_id'] ?? null;

            $this->validatePoll($payload['poll'] ?? null);

            $contentData = array_filter([
                'text' => $payload['text'] ?? null,
                'poll' => $payload['poll'] ?? null,
                'youtube' => $payload['youtube'] ?? null,
                'is_avatar_update' => !empty($payload['is_avatar_update']) ? true : null,
            ]);

            $post = $user->posts()->create([
                'target_user_id' => $targetUserId == $user->id ? null : $targetUserId,
                'content' => empty($contentData) ? null : $contentData,
                'original_post_id' => $originalPostId,
                'is_repost' => (bool)$originalPostId
            ]);

            if (!empty($mediaFiles))
            {
                $this->uploadMedia($post, $user->username, $mediaFiles);
            }

            $this->handleMentions($post, $user, $targetUserId);
            $this->handleNotifications($post, $user, $targetUserId, $originalPostId);

            return $post;
        });
    }

    public function updatePost(Post $post, array $data, ?array $newMedia, ?array $deletedMediaIds): Post
    {
        return DB::transaction(function () use ($post, $data, $newMedia, $deletedMediaIds)
        {
            $payload = $data['payload'] ?? [];

            $currentMediaCount = $post->attachments()->count();
            $deletedMediaCount = !empty($deletedMediaIds) ? count($deletedMediaIds) : 0;
            $newMediaCount = !empty($newMedia) ? count($newMedia) : 0;

            if (($currentMediaCount - $deletedMediaCount + $newMediaCount) > 10)
            {
                throw new ApiException('ERR_MAX_MEDIA_EXCEEDED', 422);
            }

            $contentData = $post->content ?? [];

            if (array_key_exists('text', $payload))
            {
                $contentData['text'] = $payload['text'] ?: null;
            }
            if (array_key_exists('youtube', $payload))
            {
                $contentData['youtube'] = $payload['youtube'] ?: null;
            }

            $contentData = array_filter($contentData, fn($val) => !is_null($val));

            $post->update([
                'content' => empty($contentData) ? null : $contentData
            ]);

            if (!empty($deletedMediaIds))
            {
                $attachmentsToDelete = $post->attachments()->whereIn('id', $deletedMediaIds)->get();
                foreach ($attachmentsToDelete as $attachment)
                {
                    $this->fileService->delete($attachment->file_path);
                    $attachment->delete();
                }
            }

            if (!empty($newMedia))
            {
                $this->uploadMedia($post, $post->user->username, $newMedia);
            }

            return $post;
        });
    }

    public function deletePost(Post $post): void
    {
        DB::transaction(function () use ($post)
        {
            $content = $post->content;

            if (!empty($content['is_avatar_update']))
            {
                $user = $post->user;

                if ($user->avatar_post_id === $post->id)
                {
                    $previousAvatarPost = Post::where('user_id', $user->id)
                        ->where('id', '!=', $post->id)
                        ->whereJsonContains('content->is_avatar_update', true)
                        ->latest()
                        ->first();

                    if ($previousAvatarPost && $previousAvatarPost->attachments->isNotEmpty())
                    {
                        $user->update([
                            'avatar' => $previousAvatarPost->attachments->first()->file_path,
                            'avatar_post_id' => $previousAvatarPost->id
                        ]);
                    } else
                    {
                        $user->update(['avatar' => null, 'avatar_post_id' => null]);
                    }
                }
            }

            foreach ($post->attachments as $attachment)
            {
                $this->fileService->delete($attachment->file_path);
            }

            $post->delete();
        });
    }

    private function validatePoll(?array $poll): void
    {
        if (empty($poll)) return;

        if (empty(trim($poll['question'] ?? ''))) throw new ApiException('ERR_POLL_QUESTION_EMPTY', 422);
        if (!isset($poll['options']) || !is_array($poll['options'])) throw new ApiException('ERR_POLL_OPTIONS_INVALID', 422);
        if (count($poll['options']) < 2 || count($poll['options']) > 16) throw new ApiException('ERR_POLL_OPTIONS_LIMIT', 422);

        $hasCorrectOption = false;
        foreach ($poll['options'] as $option)
        {
            if (empty(trim($option['text'] ?? ''))) throw new ApiException('ERR_POLL_OPTION_EMPTY', 422);
            if (!empty($option['is_correct'])) $hasCorrectOption = true;
        }

        if (($poll['type'] ?? 'regular') === 'quiz' && !$hasCorrectOption)
        {
            throw new ApiException('ERR_QUIZ_NO_CORRECT_OPTION', 422);
        }
    }

    private function handleMentions(Post $post, User $user, ?int $targetUserId): void
    {
        $textNode = $post->content['text'] ?? null;
        if (empty($textNode) || !is_array($textNode)) return;

        $mentionedUsernames = array_unique($this->extractMentions($textNode));

        if (!empty($mentionedUsernames))
        {
            $mentionedUsers = User::whereIn('username', $mentionedUsernames)
                ->where('id', '!=', $user->id)
                ->where('id', '!=', $targetUserId)
                ->get();

            foreach ($mentionedUsers as $mentionedUser)
            {
                $mentionedUser->notify(new MentionNotification($user, $post));
            }
        }
    }

    /**
     * Чиста рекурсивна функція для парсингу TipTap JSON
     */
    private function extractMentions(array|string $node): array
    {
        $usernames = [];

        if (isset($node['type']) && $node['type'] === 'mention')
        {
            // TipTap може зберігати нікнейм в id, username або label
            $username = $node['attrs']['username'] ?? $node['attrs']['id'] ?? $node['attrs']['label'] ?? null;
            if ($username)
            {
                // Відкидаємо символ @ якщо він випадково зберігся
                $usernames[] = ltrim($username, '@');
            }
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            foreach ($node['content'] as $child)
            {
                if (is_array($child))
                {
                    $usernames = array_merge($usernames, $this->extractMentions($child));
                }
            }
        }

        return $usernames;
    }

    private function uploadMedia(Post $post, string $username, array $mediaFiles): void
    {
        $lastOrder = $post->attachments()->max('sort_order') ?? -1;

        foreach ($mediaFiles as $index => $file)
        {
            $mime = $file->getMimeType();
            $type = match (true)
            {
                str_starts_with($mime, 'image/') => 'image',
                str_starts_with($mime, 'video/') => 'video',
                str_starts_with($mime, 'audio/') => 'audio',
                default => 'document',
            };

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