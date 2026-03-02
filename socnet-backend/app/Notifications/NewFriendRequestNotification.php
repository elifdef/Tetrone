<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewFriendRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $requester;

    public function __construct(User $requester)
    {
        $this->requester = $requester;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_friend_request',
            'user_id' => $this->requester->id,
            'user_username' => $this->requester->username,
            'user_first_name' => $this->requester->first_name,
            'user_last_name' => $this->requester->last_name,
            'user_avatar' => $this->requester->avatar_url,
            'user_gender' => $this->requester->gender,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}