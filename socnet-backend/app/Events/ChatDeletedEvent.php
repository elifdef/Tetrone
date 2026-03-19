<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatDeletedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chat_slug;
    private $targetUserId;

    public function __construct($chat_slug, $targetUserId)
    {
        $this->chat_slug = $chat_slug;
        $this->targetUserId = $targetUserId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('App.Models.User.' . $this->targetUserId);
    }

    public function broadcastAs()
    {
        return 'chat_deleted';
    }
}