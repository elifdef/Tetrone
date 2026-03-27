<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewWallPostNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $author;
    public $post;

    public function __construct(User $author, Post $post)
    {
        $this->author = $author;
        $this->post = $post;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $contentMap = is_array($this->post->content) ? $this->post->content : [];

        // Віддаємо СИРИЙ JSON-об'єкт тексту
        $snippet = $contentMap['text'] ?? null;

        // Якщо тексту немає, відправляємо системні КОДИ
        if (empty($snippet))
        {
            if (isset($contentMap['poll']))
            {
                $snippet = 'POLL';
            } elseif (isset($contentMap['youtube']) || $this->post->attachments()->exists())
            {
                $snippet = 'ATTACHMENT';
            } elseif (isset($contentMap['is_avatar_update']))
            {
                $snippet = 'AVATAR_UPDATE';
            }
        }

        return [
            'type' => 'wall_post',
            'user_id' => $this->author->id,
            'user_username' => $this->author->username,
            'user_first_name' => $this->author->first_name,
            'user_last_name' => $this->author->last_name,
            'user_avatar' => $this->author->avatar_url,
            'user_gender' => $this->author->gender,
            'post_id' => $this->post->id,
            'post_snippet' => $snippet,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $data = $this->toArray($notifiable);
        $settings = $notifiable->notificationSettings;

        $isEnabled = $settings ? $settings->notify_wall_posts : true;

        $data['sound'] = $isEnabled ? ($settings ? $settings->sound_wall_posts : null) : 'none';
        $data['show_toast'] = $isEnabled;

        return new BroadcastMessage($data);
    }
}