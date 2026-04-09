<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use App\Models\UserPrivacyException;
use App\Enums\PrivacyLevel;

class PrivacyService
{
    /**
     * Отримати поточні налаштування та винятки
     */
    public function getSettingsAndExceptions(User $user): array
    {
        $settings = $user->privacy_settings ?? [];

        $exceptions = $user->privacyExceptions()
            ->with('targetUser:id,username,first_name,last_name,avatar')
            ->get();

        return [
            'settings' => $settings,
            'exceptions' => $exceptions
        ];
    }

    /**
     * Оновити одне конкретне налаштування
     */
    public function updateSetting(User $user, string $context, int $level): array
    {
        $settings = $user->privacy_settings ?? [];

        $settings[$context] = $level;

        $user->privacy_settings = $settings;
        $user->save();

        return $settings;
    }

    /**
     * Додати або оновити виняток (updateOrCreate запобігає дублям)
     */
    public function storeException(User $user, array $data): UserPrivacyException
    {
        $exception = $user->privacyExceptions()->updateOrCreate(
            [
                'target_user_id' => $data['target_user_id'],
                'context' => $data['context'],
            ],
            ['is_allowed' => $data['is_allowed']]
        );

        return $exception->load('targetUser:id,username,first_name,last_name,avatar');
    }

    /**
     * Видалити виняток (захищено: юзер видаляє лише СВОЇ винятки)
     */
    public function deleteException(User $user, int $exceptionId): void
    {
        $user->privacyExceptions()->where('id', $exceptionId)->delete();
    }

    /**
     * Перевірка доступу (Політика)
     */
    public function canAccess(User $owner, ?User $accessor, string $context): bool
    {
        if ($accessor?->id === $owner->id)
        {
            return true;
        }

        if ($accessor && $accessor->role?->value >= Role::Moderator->value)
        {
            return true;
        }

        $settings = $owner->privacy_settings ?? [];
        $levelValue = $settings[$context] ?? PrivacyLevel::Everyone->value;
        $level = PrivacyLevel::tryFrom($levelValue) ?? PrivacyLevel::Everyone;

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