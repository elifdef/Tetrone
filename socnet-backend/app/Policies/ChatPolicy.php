<?php

namespace App\Policies;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;

class ChatPolicy
{
    /**
     * Чи є користувач учасником чату
     */
    public function access(User $user, Chat $chat): bool
    {
        return $chat->participants()->where('user_id', $user->id)->exists();
    }

    /**
     * Чи може користувач керувати (редагувати/видаляти) повідомленням
     */
    public function manageMessage(User $user, Chat $chat, Message $message): bool
    {
        return $this->access($user, $chat) && $message->sender_id === $user->id;
    }
}