<?php

use App\Http\Controllers\Api\v1\ActivityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'not_banned'])->group(function ()
{
    Route::prefix('activity')->controller(ActivityController::class)
        ->group(function ()
        {
            Route::get('/liked', 'likedPosts');
            Route::get('/reposts', 'reposts');
            Route::get('/comments', 'comments');
            Route::get('/counts', 'getCounts');
            Route::get('/voted-polls', 'votedPolls');
            Route::get('/screen-time', 'screenTime');
        });
});