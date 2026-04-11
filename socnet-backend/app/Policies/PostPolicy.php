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
     * Чи може юзер БАЧИТИ цей пост (відкривати по прямому ID)
     */
    public function view(?User $user, Post $post): bool
    {
        // Власник поста завжди бачить свій пост
        if ($user && $user->id === $post->user_id) {
            return true;
        }

        // Якщо пост написаний комусь на стіну, власник стіни теж його бачить завжди
        if ($user && $user->id === $post->target_user_id) {
            return true;
        }

        // Якщо юзер авторизований, перевіряємо чорні списки
        if ($user) {
            // Якщо автор поста заблокував мене
            if ($user->isBlockedByTarget($user->id, $post->user_id)) return false;

            // Якщо власник стіни (де лежить пост) заблокував мене
            if ($post->target_user_id && $user->isBlockedByTarget($user->id, $post->target_user_id)) return false;
        }

        $wallOwner = $post->targetUser ?? $post->user;

        return app(PrivacyService::class)->canAccess($wallOwner, $user, PrivacyContext::Profile->value);
    }

    /**
     * Чи може юзер оновити пост?
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    /**
     * Чи може юзер видалити цей пост?
     */
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->id === $post->target_user_id;
    }

    /**
     * Чи може юзер коментувати?
     */
    public function comment(User $user, Post $post): bool
    {
        if (!$post->can_comment) return false;
        if ($user->isBlockedByTarget($user->id, $post->user_id)) return false;
        if ($user->isBlockedByTarget($post->user_id, $user->id)) return false;

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
     * Чи може юзер зробити репост цього поста?
     */
    public function repost(User $user, Post $post): bool
    {
        if (!$user->can('interact', $post->user)) return false;

        return app(PrivacyService::class)->canAccess($post->user, $user, PrivacyContext::Profile->value);
    }
}