<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\ReportController;

Route::middleware(['auth:sanctum', 'not_banned'])->group(function ()
{
    Route::get('/reports/reasons', [ReportController::class, 'getReasons']);
    Route::post('/reports', [ReportController::class, 'store']);
});