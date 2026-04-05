<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\PersonalizationController;
use App\Http\Controllers\Api\v1\NotificationSettingsController;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\PrivacySettingsController;

Route::middleware(['auth:sanctum', 'throttle:120,1', 'not_banned'])->prefix('settings')->group(function ()
{
    // Персоналізація
    Route::controller(PersonalizationController::class)->prefix('personalization')->group(function ()
    {
        Route::get('/', 'show');
        Route::post('/', 'update');
    });

    // Сповіщення
    Route::controller(NotificationSettingsController::class)->prefix('notifications')->group(function ()
    {
        Route::get('/', 'getSettings');
        Route::put('/', 'updateSettings');

        Route::get('/overrides', 'getOverrides');
        Route::put('/overrides/{targetUserId}', 'updateOverride');
        Route::delete('/overrides/{targetUserId}', 'deleteOverride');
    });

    // Сесії
    Route::controller(AuthController::class)->prefix('sessions')->group(function ()
    {
        Route::get('/', 'getSessions');
        Route::delete('/', 'revokeAllOtherSessions');
        Route::delete('/{tokenId}', 'revokeSession');
    });

    // Приватність
    Route::controller(PrivacySettingsController::class)->prefix('privacy')->group(function ()
    {
        Route::get('/', 'index');
        Route::patch('/', 'update');
        Route::post('/exceptions', 'storeException');
        Route::delete('/exceptions/{id}', 'destroyException');
    });
});