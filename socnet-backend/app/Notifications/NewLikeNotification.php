<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Str;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewLikeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $liker;
    public $post;

    public function __construct(User $liker, Post $post)
    {
        $this->liker = $liker;
        $this->post = $post;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $snippet = $this->post->content ? Str::limit(strip_tags($this->post->content), 40) : null;

        return [
            'type' => 'new_like',
            'user_id' => $this->liker->id,
            'user_username' => $this->liker->username,
            'user_first_name' => $this->liker->first_name,
            'user_last_name' => $this->liker->last_name,
            'user_avatar' => $this->liker->avatar_url,
            'user_gender' => $this->liker->gender,
            'post_id' => $this->post->id,
            'post_snippet' => $snippet,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $data = $this->toArray($notifiable);
        $settings = $notifiable->notificationSettings;

        $isEnabled = $settings ? $settings->notify_likes : true;

        $data['sound'] = $isEnabled ? ($settings ? $settings->sound_likes : null) : 'none';
        $data['show_toast'] = $isEnabled;

        return new BroadcastMessage($data);
    }
}