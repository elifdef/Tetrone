<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\NewCommentNotification;
use App\Notifications\MentionNotification;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class CommentService
{
    public function getPostComments(Post $post): LengthAwarePaginator
    {
        return $post->comments()
            ->with('user')
            ->whereHas('user', fn($q) => $q->where('is_banned', false))
            ->latest()
            ->paginate(config('comments.max_paginate', 30));
    }

    public function getMyComments(User $user): LengthAwarePaginator
    {
        return $user->comments()
            ->with(['post.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(config('comments.max_paginate', 30));
    }

    public function createComment(Post $post, User $author, array $content): Comment
    {
        if (!$this->hasActualContent($content))
        {
            throw new ApiException('ERR_EMPTY_MESSAGE', 422);
        }

        return DB::transaction(function () use ($post, $author, $content)
        {
            $comment = $post->comments()->create(['content' => $content, 'user_id' => $author->id]);
            $this->sendNotifications($post, $comment, $author);
            return $comment;
        });
    }

    public function updateComment(Comment $comment, array $content): Comment
    {
        if (!$this->hasActualContent($content))
        {
            throw new ApiException('ERR_EMPTY_MESSAGE', 422);
        }
        $comment->update(['content' => $content]);
        return $comment;
    }

    private function sendNotifications(Post $post, Comment $comment, User $author): void
    {
        // Сповіщення автору поста
        if ($post->user_id !== $author->id)
        {
            $prefs = $post->user->getNotificationPreferencesFor($author->id, 'comments');
            if ($prefs['should_notify'])
            {
                $post->user->notify(new NewCommentNotification($author, $post, $comment, $prefs['sound'] ?? 'default'));
            }
        }

        // Обробка згадок (mentions)
        $mentionedUsernames = [];
        if (is_array($comment->content))
        {
            $this->extractMentions($comment->content, $mentionedUsernames);
        }
        $mentionedUsernames = array_unique($mentionedUsernames);

        if (!empty($mentionedUsernames))
        {
            $mentionedUsers = User::whereIn('username', $mentionedUsernames)->get();

            foreach ($mentionedUsers as $mentionedUser)
            {
                if ($mentionedUser->id !== $author->id && $mentionedUser->id !== $post->user_id)
                {
                    $mentionedUser->notify(new MentionNotification($author, $post, $comment));
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

    private function hasActualContent(array $node): bool
    {
        if (isset($node['type']) && in_array($node['type'], ['text', 'customSticker', 'mention']))
        {
            return true;
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            foreach ($node['content'] as $child)
            {
                if (is_array($child) && $this->hasActualContent($child))
                {
                    return true;
                }
            }
        }

        return false;
    }
}