<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use App\Models\Friendship;
use App\Enums\PrivacyLevel;

class PrivacyService
{
    public function canAccess(User $owner, ?User $accessor, string $context): bool
    {
        // 1. Власник може все
        if ($accessor?->id === $owner->id)
        {
            return true;
        }

        // 2. Модератори та Адміни мають доступ до всього
        if ($accessor && $accessor->role?->value >= Role::Moderator->value)
        {
            return true;
        }

        // 2. Дістаємо налаштування з JSON (якщо немає - дефолт 0, тобто Everyone)
        $settings = $owner->privacy_settings ?? [];
        $levelValue = $settings[$context] ?? PrivacyLevel::Everyone->value;
        $level = PrivacyLevel::tryFrom($levelValue) ?? PrivacyLevel::Everyone;

        // 3. Перевіряємо кастомні винятки
        if ($accessor)
        {
            $exception = $owner->privacyExceptions()
                ->where('target_user_id', $accessor->id)
                ->where('context', $context)
                ->first();

            if ($exception)
            {
                return (bool)$exception->is_allowed;
            }
        }

        return match ($level)
        {
            PrivacyLevel::Everyone => true,
            PrivacyLevel::Friends => $accessor ? $owner->getFriendshipStatusWith($accessor) === 'friends' : false,
            PrivacyLevel::Nobody => false,
            PrivacyLevel::Custom => false,
        };
    }
}