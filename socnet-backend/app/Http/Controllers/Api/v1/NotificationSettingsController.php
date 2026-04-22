<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\User;
use App\Services\FileStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificationSettingsController extends Controller
{
    public function __construct(protected FileStorageService $fileService)
    {
    }

    /**
     * Отримати налаштування сповіщень
     *
     * @group Notifications
     * @authenticated
     * @response 200
     */
    public function getSettings(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => 'SETTINGS_RETRIEVED',
            'data' => $request->user()->notificationSettings
        ], 200);
    }

    /**
     * Оновити налаштування сповіщень
     *
     * @group Notifications
     * @authenticated
     * @response 200
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $validatedData = [];
        $types = ['likes', 'comments', 'reposts', 'friend_requests', 'messages', 'wall_posts'];

        // отримуємо реальні налаштування з бази для правильного видалення старого файлу
        $oldSettings = $user->notificationSettings()->first();

        foreach ($types as $type)
        {
            $notifyKey = "notify_{$type}";
            $soundKey = "sound_{$type}";

            if ($request->has($notifyKey))
            {
                $validatedData[$notifyKey] = $request->boolean($notifyKey);
            }

            if ($request->hasFile($soundKey))
            {
                $request->validate([
                    $soundKey => 'file|mimes:mp3,wav,ogg,m4a,aac|max:5120'
                ]);

                if ($oldSettings && $oldSettings->$soundKey && str_starts_with($oldSettings->$soundKey, asset('storage/')))
                {
                    $oldPath = str_replace(asset('storage/') . '/', '', $oldSettings->$soundKey);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $this->fileService->upload($request->file($soundKey), $user->username . '/notifications', 'sound');
                $validatedData[$soundKey] = asset('storage/' . $path);
            } elseif ($request->has($soundKey))
            {
                $newValue = $request->input($soundKey);

                if ($oldSettings && $oldSettings->$soundKey && str_starts_with($oldSettings->$soundKey, asset('storage/')) && $oldSettings->$soundKey !== $newValue)
                {
                    $oldPath = str_replace(asset('storage/') . '/', '', $oldSettings->$soundKey);
                    Storage::disk('public')->delete($oldPath);
                }

                $validatedData[$soundKey] = $newValue;
            }
        }

        $settings = $user->notificationSettings()->updateOrCreate(
            ['user_id' => $user->id],
            $validatedData
        );

        return response()->json([
            'success' => true,
            'code' => 'SETTINGS_UPDATED',
            'data' => $settings
        ], 200);
    }

    /**
     * Отримати винятки для сповіщень (перевизначення)
     *
     * @group Notifications
     * @authenticated
     * @response 200
     */
    public function getOverrides(Request $request): JsonResponse
    {
        $overrides = $request->user()->notificationOverrides()
            ->with('targetUser:id,username,first_name,last_name,avatar')
            ->get();

        return response()->json([
            'success' => true,
            'code' => 'OVERRIDES_RETRIEVED',
            'data' => $overrides
        ], 200);
    }

    /**
     * Оновити виняток для конкретного користувача
     *
     * @group Notifications
     * @authenticated
     * @response 200
     */
    public function updateOverride(Request $request, User $targetUser): JsonResponse
    {
        $request->validate([
            'is_muted' => 'boolean',
            'custom_sound' => 'nullable|string|max:255',
        ]);

        if ($request->user()->id === $targetUser->id)
        {
            return response()->json([
                'success' => false,
                'code' => 'ERR_MUTE_SELF',
                'message' => 'You cannot mute yourself.'
            ], 400);
        }

        $override = $request->user()->notificationOverrides()->updateOrCreate(
            ['target_user_id' => $targetUser->id],
            [
                'is_muted' => $request->input('is_muted', false),
                'custom_sound' => $request->input('custom_sound', null),
            ]
        );

        return response()->json([
            'success' => true,
            'code' => 'OVERRIDE_UPDATED',
            'data' => $override->load('targetUser:id,username,first_name,last_name,avatar')
        ], 200);
    }

    /**
     * Видалити виняток
     *
     * @group Notifications
     * @authenticated
     * @response 200
     */
    public function deleteOverride(Request $request, User $targetUser): JsonResponse
    {
        $request->user()->notificationOverrides()
            ->where('target_user_id', $targetUser->id)
            ->delete();

        return response()->json([
            'success' => true,
            'code' => 'OVERRIDE_DELETED'
        ], 200);
    }
}