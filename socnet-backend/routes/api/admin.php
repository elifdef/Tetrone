<?php

use App\Http\Controllers\Api\v1\Admin\DashboardController;
use App\Http\Controllers\Api\v1\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'not_banned'])->group(function ()
{
    Route::prefix('admin')->group(function ()
    {
        // інформація
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/posts', [AdminController::class, 'getPosts']);
        Route::get('/users/{user:username}', [AdminController::class, 'getUserProfile']);
        Route::get('/users/{user:username}', [AdminController::class, 'getUserProfile']);
        Route::get('/users/{user:username}/posts', [AdminController::class, 'getUserPosts']);
        Route::get('/users/{user:username}/comments', [AdminController::class, 'getUserComments']);
        Route::get('/users/{user:username}/likes', [AdminController::class, 'getUserLikes']);
        Route::get('/users/{user:username}/sessions', [AdminController::class, 'getUserSessions']);

        // дії над користувачами
        Route::post('/users/{user:username}/mute', [AdminController::class, 'toggleMute']);
        Route::post('/users/{user:username}/ban', [AdminController::class, 'toggleBan']);

        // статистика
        Route::get('/dashboard', [DashboardController::class, 'getStats']);

        // апеляція
        Route::get('/appeals', [AdminController::class, 'getAppeals']);
        Route::post('/appeals/{appeal}/resolve', [AdminController::class, 'resolveAppeal']);
        Route::post('/appeals/{appeal}/reject', [AdminController::class, 'rejectAppeal']);
    });
});