<?php

use App\Http\Controllers\Api\v1\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/stats/landing', [StatsController::class, 'getLandingStats']);
Route::get('/stats/recent-users', [StatsController::class, 'getRecentUsers']);
