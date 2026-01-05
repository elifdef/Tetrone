<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\UserController;
use App\Http\Controllers\Api\v1\AuthController;

Route::prefix('v1')->group(function ()
{
    // auth
    Route::middleware('throttle:6,1')->group(function ()
    {
        Route::post('sign-up', [AuthController::class, 'register']);
        Route::post('sign-in', [AuthController::class, 'login']);
    });

    // users
    Route::middleware('throttle:60,1')->group(function ()
    {
        Route::get('users/{username}', [UserController::class, 'show']);
    });

    // тільки для тих, хто має токен)
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function ()
    {

    });
});
