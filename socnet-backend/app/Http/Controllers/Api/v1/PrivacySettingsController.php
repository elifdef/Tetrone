<?php

namespace App\Http\Controllers\Api\v1;

use Illuminate\Http\Request;
use App\Enums\PrivacyContext;
use App\Enums\PrivacyLevel;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Http\JsonResponse;

class PrivacySettingsController extends Controller
{
    /**
     * Отримати поточні налаштування та список винятків
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $settings = $user->privacy_settings ?? [];

        $exceptions = $user->privacyExceptions()
            ->with('targetUser:id,username,first_name,last_name,avatar')
            ->get();

        return $this->success('PRIVACY_SETTINGS_RETRIEVED', 'Privacy settings retrieved', [
            'settings' => $settings,
            'exceptions' => $exceptions
        ]);
    }

    /**
     * Оновити одне конкретне налаштування (наприклад, тільки avatar)
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'context' => ['required', new Enum(PrivacyContext::class)],
            'level' => ['required', new Enum(PrivacyLevel::class)],
        ]);

        $user = $request->user();
        $settings = $user->privacy_settings ?? [];

        // Оновлюємо конкретний ключ
        $settings[$request->context] = $request->level;

        $user->privacy_settings = $settings;
        $user->save();

        return $this->success('PRIVACY_SETTING_UPDATED', 'Setting updated', $settings);
    }

    /**
     * Додати або оновити виняток (ОКРІМ)
     */
    public function storeException(Request $request): JsonResponse
    {
        $request->validate([
            'target_user_id' => 'required|exists:users,id',
            'context' => ['required', new Enum(PrivacyContext::class)],
            'is_allowed' => 'required|boolean',
        ]);

        $user = $request->user();

        // updateOrCreate запобігає дублям
        $exception = $user->privacyExceptions()->updateOrCreate(
            [
                'target_user_id' => $request->target_user_id,
                'context' => $request->context,
            ],
            ['is_allowed' => $request->is_allowed]
        );

        return $this->success('PRIVACY_EXCEPTION_SAVED', 'Exception saved', $exception->load('targetUser:id,username,first_name,last_name,avatar'));
    }

    /**
     * Видалити виняток
     */
    public function destroyException(Request $request, $id): JsonResponse
    {
        $request->user()->privacyExceptions()->where('id', $id)->delete();
        return $this->success('PRIVACY_EXCEPTION_DELETED', 'Exception deleted');
    }
}