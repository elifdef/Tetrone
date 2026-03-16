<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesReadEvent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public $chat_slug;
    public $read_by_user_id; // хто прочитав
    private $target_user_id; // кому відправляємо івент (автору повідомлень)

    public function __construct($chatSlug, $readByUserId, $targetUserId)
    {
        $this->chat_slug = $chatSlug;
        $this->read_by_user_id = $readByUserId;
        $this->target_user_id = $targetUserId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('App.Models.User.' . $this->target_user_id);
    }

    public function broadcastAs()
    {
        return 'messages_read';
    }
}