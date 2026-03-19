<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserBlockedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $blocker_id;
    private $targetUserId;

    public function __construct($blocker_id, $targetUserId)
    {
        $this->blocker_id = $blocker_id;
        $this->targetUserId = $targetUserId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('App.Models.User.' . $this->targetUserId);
    }

    public function broadcastAs()
    {
        return 'user_blocked';
    }
}