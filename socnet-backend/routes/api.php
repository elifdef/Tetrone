<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::prefix('v1')->group(function ()
{
    require __DIR__ . '/api/auth.php';
    require __DIR__ . '/api/users.php';
    require __DIR__ . '/api/friends.php';
    require __DIR__ . '/api/posts.php';
    require __DIR__ . '/api/admin.php';
    require __DIR__ . '/api/notifications.php';
    require __DIR__ . '/api/activity.php';
    require __DIR__ . '/api/reports.php';
    require __DIR__ . '/api/messages.php';
    require __DIR__ . '/api/stickers.php';
});