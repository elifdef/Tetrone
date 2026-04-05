<?php

use App\Http\Controllers\Api\v1\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;

// публічне отримання БАЗОВОЇ інформації профілю (120 запитів/хв)
Route::middleware('throttle:120,1')->get('users/{username}', [UserController::class, 'show']);

Route::middleware(['auth:sanctum', 'throttle:150,1'])->group(function ()
{

    // Отримати поточного юзера
    Route::get('me', function (Request $request)
    {
        return new UserResource($request->user())->resolve();
    });

    // Дозволено тільки НЕ ЗАБЛОКОВАНИМ юзерам
    Route::middleware(['not_banned'])->group(function ()
    {
        // Встановлення офлайн статусу
        Route::post('/user/offline', function (Request $request)
        {
            $user = $request->user();
            Cache::forget("user-online-{$user->id}");
            $user->update(['last_seen_at' => now()]);
            return response()->noContent();
        });

        Route::controller(UserController::class)->group(function ()
        {
            Route::get('/users', 'index');
            Route::patch('/users/{username}', 'update');
            Route::put('/user/email', 'updateEmail');
            Route::put('/user/password', 'updatePassword');
        });
    });
});