<?php

namespace App\Policies;

use App\Models\User;
use App\Enums\Role;
use App\Enums\PrivacyContext;
use App\Services\PrivacyService;

class UserPolicy
{
    /**
     * адмінам можно все
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role?->value >= Role::Moderator->value)
        {
            return true;
        }

        return null;
    }

    /**
     * Чи може поточний адмін/модератор забанити/замутити іншого юзера?
     */
    public function moderate(User $me, User $target): bool
    {
        return $me->role->value > $target->role->value;
    }

    /**
     * Чи має юзер доступ до Адмін-панелі взагалі?
     */
    public function viewAdminPanel(User $me): bool
    {
        return $me->role->value === Role::Admin->value;
    }

    /**
     * чи він не в чс
     */
    public function interact(User $me, User $target): bool
    {
        if ($me->id === $target->id) return true;
        if ($me->isBlockedByTarget($target->id, $me->id)) return false;
        if ($me->isBlockedByTarget($me->id, $target->id)) return false;

        return true;
    }

    /**
     * Чи можно написати пост на ЙОГО стіні
     */
    public function writeOnWall(User $me, User $target): bool
    {
        if (!$this->interact($me, $target)) return false;
        return app(PrivacyService::class)->canAccess($target, $me, PrivacyContext::WallPost->value);
    }

    /**
     * Чи можу я взагалі бачити його профіль
     */
    public function viewProfile(User $me, User $target): bool
    {
        if (!$this->interact($me, $target)) return false;
        return app(PrivacyService::class)->canAccess($target, $me, PrivacyContext::Profile->value);
    }

    /**
     * Чи можно відправити йому заявку в друзі
     */
    public function addFriend(User $me, User $target): bool
    {
        if ($me->id === $target->id) return false; // добавляти самого себе не можна (я гуль 1000-7)
        if (!$this->interact($me, $target)) return false;
        return true;
    }

    /**
     * Чи можно написати йому повідомлення
     */
    public function sendMessage(User $me, User $target): bool
    {
        if ($me->id === $target->id) return true; // писати самому собі можна (Тайлер Дерден)
        if (!$this->interact($me, $target)) return false;
        return app(PrivacyService::class)->canAccess($target, $me, PrivacyContext::Message->value);
    }
}