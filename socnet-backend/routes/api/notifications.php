<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function ()
{

    // Отримати останні 20 сповіщень
    Route::get('/notifications', function (Request $request)
    {
        $notifications = $request->user()->notifications()->take(20)->get();

        $userIds = $notifications->pluck('data.user_id')->filter()->unique();

        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $notifications->transform(function ($notification) use ($users)
        {
            $data = $notification->data;

            if (isset($data['user_id']) && $users->has($data['user_id']))
            {
                $user = $users[$data['user_id']];

                $data['user'] = [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'avatar' => $user->avatar_url,
                    'username' => $user->username,
                    'gender' => $user->gender,
                ];

                $notification->data = $data;
            }

            return $notification;
        });

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count()
        ]);
    });

    // Позначити конкретне сповіщення як прочитане
    Route::post('/notifications/{id}/read', function (Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['status' => true]);
    });

});