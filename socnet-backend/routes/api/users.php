<?php

use App\Http\Controllers\Api\v1\PersonalizationController;
use App\Http\Controllers\Api\v1\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;

// публічне отримання БАЗОВОЇ інформації профілю (120 запитів/мін)
Route::middleware('throttle:120,1')->controller(UserController::class)->group(function ()
{
    Route::get('users/{username}', 'show');
});

Route::middleware(['auth:sanctum', 'throttle:150,1'])->group(function ()
{
    Route::get('me', function (Request $request)
    {
        return (new UserResource($request->user()))->resolve();
    });

    Route::middleware(['not_banned'])->group(function ()
    {
        Route::post('/user/offline', function (Request $request)
        {
            $user = $request->user();
            Cache::forget("user-online-{$user->id}");
            $user->update(['last_seen_at' => now()]);
            return response()->noContent();
        });

        // редагування профілю
        Route::patch('users/{username}', [UserController::class, 'update']);
        Route::put('/user/email', [UserController::class, 'updateEmail']);
        Route::put('/user/password', [UserController::class, 'updatePassword']);
        Route::get('/users', [UserController::class, 'index']);

        // персоналізація
        Route::get('/settings/personalization', [PersonalizationController::class, 'show']);
        Route::post('/settings/personalization', [PersonalizationController::class, 'update']);
    });
});