<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class NewCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $commenter;
    public $post;
    public $comment;

    public function __construct(User $commenter, Post $post, $comment)
    {
        $this->commenter = $commenter;
        $this->post = $post;
        $this->comment = $comment;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $snippet = $this->comment->content ? Str::limit(strip_tags($this->comment->content), 40) : null;

        return [
            'type' => 'new_comment',
            'user_id' => $this->commenter->id,
            'user_username' => $this->commenter->username,
            'user_first_name' => $this->commenter->first_name,
            'user_last_name' => $this->commenter->last_name,
            'user_avatar' => $this->commenter->avatar_url,
            'user_gender' => $this->commenter->gender,
            'post_id' => $this->post->id,
            'post_snippet' => $snippet,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}