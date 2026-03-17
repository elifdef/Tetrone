<?php

namespace App\Http\Controllers\Api\v1;

use Illuminate\Http\Request;
use App\Models\User;
use App\Services\FileStorageService;
use Illuminate\Support\Facades\Storage;

class NotificationSettingsController extends Controller
{
    protected $fileService;

    public function __construct(FileStorageService $fileService)
    {
        $this->fileService = $fileService;
    }

    public function getSettings(Request $request)
    {
        return response()->json($request->user()->notificationSettings);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();
        $validatedData = [];

        $types = ['likes', 'comments', 'reposts', 'friend_requests', 'messages', 'wall_posts'];

        // отримуємо реальні налаштування з бази
        // це потрібно щоб правильно видалити старий файл
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
            } 
            elseif ($request->has($soundKey))
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
            'status' => true,
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }

    public function getOverrides(Request $request)
    {
        $overrides = $request->user()->notificationOverrides()
            ->with('targetUser:id,username,first_name,last_name,avatar')
            ->get();

        return response()->json($overrides);
    }

    public function updateOverride(Request $request, $targetUserId)
    {
        $request->validate([
            'is_muted' => 'boolean',
            'custom_sound' => 'nullable|string|max:255',
        ]);

        User::findOrFail($targetUserId);

        if ($request->user()->id == $targetUserId)
        {
            return response()->json(['message' => 'You cannot mute yourself.'], 400);
        }

        $override = $request->user()->notificationOverrides()->updateOrCreate(
            ['target_user_id' => $targetUserId],
            [
                'is_muted' => $request->input('is_muted', false),
                'custom_sound' => $request->input('custom_sound', null),
            ]
        );

        return response()->json([
            'status' => true,
            'override' => $override->load('targetUser:id,username,first_name,last_name,avatar')
        ]);
    }

    public function deleteOverride(Request $request, $targetUserId)
    {
        $request->user()->notificationOverrides()->where('target_user_id', $targetUserId)->delete();

        return response()->json(['status' => true, 'message' => 'Override removed.']);
    }
}