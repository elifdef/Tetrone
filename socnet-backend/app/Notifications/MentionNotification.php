<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MentionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $sender;
    public $post;
    public $comment;

    public function __construct($sender, $post, $comment = null)
    {
        $this->sender = $sender;
        $this->post = $post;
        $this->comment = $comment;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'mention',
            'user_id' => $this->sender->id,
            'user_first_name' => $this->sender->first_name,
            'user_last_name' => $this->sender->last_name,
            'user_avatar' => $this->sender->avatar_url,
            'user_username' => $this->sender->username,
            'user_gender' => $this->sender->gender,
            'post_id' => $this->post->id,
            'comment_uid' => $this->comment ? $this->comment->uid : null,
            'post_snippet' => $this->comment ? $this->comment->content : $this->post->content,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => 'mention',
            'created_at' => now()->toIso8601String(),
            'data' => $this->toArray($notifiable),
        ]);
    }
}