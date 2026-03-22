<?php

namespace App\Policies;

use App\Models\User;
use App\Enums\Role;

class UserPolicy
{
    /**
     * адмінам можно все
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role >= Role::Moderator->value)
        {
            return true;
        }

        return null;
    }

    /**
     * чи він не в чс
     */
    public function interact(User $me, User $target): bool
    {
        // якщо це я
        if ($me->id === $target->id)
        {
            return true;
        }

        // чи я заблокував його
        if ($me->isBlockedByTarget($target->id, $me->id))
        {
            return false;
        }

        // він заблокував мене
        if ($me->isBlockedByTarget($me->id, $target->id))
        {
            return false;
        }

        return true;
    }

    /**
     * Чи можно написати пост на ЙОГО стіні
     */
    public function writeOnWall(User $me, User $target): bool
    {
        // якщо ми в чс один одного - неа
        if (!$this->interact($me, $target))
        {
            return false;
        }

        // TODO: добавити приватність
        return true;
    }

    /**
     * Чи можу я взагалі бачити його профіль
     */
    public function viewProfile(User $me, User $target): bool
    {
        return $this->interact($me, $target);
    }

    /**
     * Чи можно відправити йому заявку в друзі
     */
    public function addFriend(User $me, User $target): bool
    {
        if ($me->id === $target->id)
        {
            return false; // добавляти самого себе не можна (я гуль 1000-7)
        }

        if (!$this->interact($me, $target))
        {
            return false;
        }

        return true;
    }

    /**
     * Чи можно написати йому повідомлення
     */
    public function sendMessage(User $me, User $target): bool
    {
        if ($me->id === $target->id)
        {
            return true; // писати самому собі можна (Тайлер Дерден)
        }

        if (!$this->interact($me, $target))
        {
            return false;
        }

        return true;
    }
}