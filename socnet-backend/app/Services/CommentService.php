<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\NewCommentNotification;
use App\Notifications\MentionNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommentService
{
    public function createComment(Post $post, User $author, array $content): Comment
    {
        if (!$this->hasActualContent($content))
        {
            throw ValidationException::withMessages(['content' => 'Comment cannot be empty.']);
        }

        return DB::transaction(function () use ($post, $author, $content)
        {
            $comment = $post->comments()->create([
                'content' => $content,
                'user_id' => $author->id
            ]);

            $this->sendNotifications($post, $comment, $author);

            return $comment;
        });
    }

    public function updateComment(Comment $comment, array $content): Comment
    {
        // Захист від видалення всього тексту при редагуванні
        if (!$this->hasActualContent($content))
        {
            throw ValidationException::withMessages(['content' => 'Comment cannot be empty.']);
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