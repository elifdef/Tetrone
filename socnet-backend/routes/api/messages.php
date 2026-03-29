<?php

use App\Http\Controllers\Api\v1\ChatController;
use App\Http\Controllers\Api\v1\ChatFileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::middleware(['auth:sanctum', 'not_banned', 'verified', 'not_muted'])
    ->prefix('chat')
    ->group(function ()
    {
        Route::get('/', [ChatController::class, 'index']);
        Route::post('/init', [ChatController::class, 'getOrCreateChat']);

        // операції над конкретним чатом
        Route::prefix('{slug}')->group(function ()
        {
            Route::delete('/', [ChatController::class, 'destroyChat']);
            Route::post('/read', [ChatController::class, 'markAsRead']);

            Route::get('/messages', [ChatController::class, 'getMessages']);
            Route::post('/message', [ChatController::class, 'sendMessage']);

            Route::get('/files/{filename}', [ChatFileController::class, 'show']);

            // операції над конкретним повідомленням
            Route::prefix('message/{messageId}')->group(function ()
            {
                Route::post('/update', [ChatController::class, 'updateMessage']);
                Route::delete('/', [ChatController::class, 'destroyMessage']);
                Route::post('/pin', [ChatController::class, 'togglePinMessage']);
            });
        });
    });