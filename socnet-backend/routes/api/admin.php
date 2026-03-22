<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Admin\DashboardController;
use App\Http\Controllers\Api\v1\Admin\UserController;
use App\Http\Controllers\Api\v1\Admin\ReportController;
use App\Http\Controllers\Api\v1\Admin\AppealController;
use App\Http\Controllers\Api\v1\Admin\PostController;

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function ()
{

    Route::get('/dashboard', [DashboardController::class, 'getStats']);

    // Юзери
    Route::prefix('users')->group(function ()
    {
        Route::get('/', [UserController::class, 'index']);

        Route::get('/{user:username}', [UserController::class, 'show']);
        Route::get('/{user:username}/posts', [UserController::class, 'posts']);
        Route::get('/{user:username}/comments', [UserController::class, 'comments']);
        Route::get('/{user:username}/likes', [UserController::class, 'likes']);
        Route::get('/{user:username}/sessions', [UserController::class, 'sessions']);

        Route::post('/{user:username}/mute', [UserController::class, 'toggleMute']);
        Route::post('/{user:username}/ban', [UserController::class, 'toggleBan']);
    });

    Route::prefix('posts')->group(function ()
    {
        Route::get('/', [PostController::class, 'index']);
    });

    // Скарги
    Route::prefix('reports')->group(function ()
    {
        Route::get('/', [ReportController::class, 'index']);
        Route::post('/{report}/resolve', [ReportController::class, 'resolve']);
        Route::post('/{report}/reject', [ReportController::class, 'reject']);
    });

    // Апеляції
    Route::prefix('appeals')->group(function ()
    {
        Route::get('/', [AppealController::class, 'index']);
        Route::post('/{appeal}/resolve', [AppealController::class, 'resolve']);
        Route::post('/{appeal}/reject', [AppealController::class, 'reject']);
    });
});