<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Enums\Role;

class PostPolicy
{
    /**
     * Якщо юзер адмін або модератор - одразу дозволяємо йому все
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
        // якщо коментарі вимкнені автором поста
        if (!$post->can_comment)
        {
            return false;
        }

        // якщо автор поста заблокував коментатора
        if ($user->isBlockedByTarget($user->id, $post->user_id))
        {
            return false;
        }

        // якщо коментатор сам заблокував автора поста
        if ($user->isBlockedByTarget($post->user_id, $user->id))
        {
            return false;
        }

        return true;
    }

    /**
     * Чи може юзер поставити лайк?
     */
    public function like(User $user, Post $post): bool
    {
        if (!$user->can('interact', $post->user))
        {
            return false;
        }

        return true;
    }

    /**
     * Чи можна зробити репост
     */
    public function repost(User $user, Post $post): bool
    {
        if (!$user->can('interact', $post->user))
        {
            return false;
        }

        // TODO: якщо користувач закрив профіль то ми не можемо репостити його пости

        return true;
    }
}