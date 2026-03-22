<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\NewCommentNotification;
use App\Notifications\MentionNotification;

class CommentService
{
    public function createComment(Post $post, User $author, string $content): Comment
    {
        $comment = $post->comments()->create([
            'content' => $content,
            'user_id' => $author->id
        ]);

        $this->sendNotifications($post, $comment, $author);

        return $comment;
    }

    private function sendNotifications(Post $post, Comment $comment, User $author): void
    {
        // сповіщення автору поста
        if ($post->user_id !== $author->id)
        {
            $prefs = $post->user->getNotificationPreferencesFor($author->id, 'comments');
            if ($prefs['should_notify'])
            {
                $post->user->notify(new NewCommentNotification($author, $post, $comment, $prefs['sound']));
            }
        }

        // сповіщення про згадки (@username)
        preg_match_all('/@([a-zA-Z0-9_.]+)/', $comment->content, $matches);
        $mentionedUsernames = array_unique($matches[1]);

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
}