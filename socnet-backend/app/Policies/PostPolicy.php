<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Enums\Role;
use App\Enums\PrivacyContext;
use App\Services\PrivacyService;

class PostPolicy
{
    /**
     * Якщо юзер адмін або модератор - одразу дозволяємо йому все
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role?->value >= Role::Moderator->value) return true;
        return null;
    }

    /**
     * Чи може юзер оновити пост
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    /**
     * Чи може юзер видалити цей пост
     */
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->id === $post->target_user_id;
    }

    /**
     * Чи може юзер залишити коментар під цим постом
     */
    public function comment(User $user, Post $post): bool
    {
        if (!$post->can_comment) return false;
        if ($user->isBlockedByTarget($user->id, $post->user_id)) return false;
        if ($user->isBlockedByTarget($post->user_id, $user->id)) return false;

        // Перевіряємо приватність автора поста на коментарі
        return app(PrivacyService::class)->canAccess($post->user, $user, PrivacyContext::Comment->value);
    }

    /**
     * Чи може юзер поставити лайк?
     */
    public function like(User $user, Post $post): bool
    {
        return $user->can('interact', $post->user);
    }

    /**
     * Чи можна зробити репост
     */
    public function repost(User $user, Post $post): bool
    {
        if (!$user->can('interact', $post->user)) return false;

        // Перевіряємо, чи взагалі відкритий профіль для репосту
        return app(PrivacyService::class)->canAccess($post->user, $user, PrivacyContext::Profile->value);
    }
}