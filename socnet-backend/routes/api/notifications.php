<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function ()
{

    // Отримати останні 20 сповіщень
    Route::get('/notifications', function (Request $request)
    {
        return response()->json([
            'notifications' => $request->user()->notifications()->take(20)->get(),
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