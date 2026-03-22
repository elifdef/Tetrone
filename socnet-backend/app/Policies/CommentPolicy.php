<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use App\Enums\Role;

class CommentPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role >= Role::Moderator->value)
        {
            return true;
        }
        return null;
    }

    /**
     * Редагувати може тільки автор коментаря
     */
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
    }

    /**
     * Видаляти може автор коментаря АБО автор поста
     */
    public function delete(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id || $user->id === $comment->post->user_id;
    }
}