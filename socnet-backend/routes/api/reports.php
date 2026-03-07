<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\ReportController;
use App\Http\Controllers\Api\v1\AdminController;

Route::middleware(['auth:sanctum', 'not_banned'])->group(function ()
{
    Route::get('/reports/reasons', [ReportController::class, 'getReasons']);
    Route::post('/reports', [ReportController::class, 'store']);

    Route::prefix('admin/reports')->group(function ()
    {
        Route::get('/', [AdminController::class, 'getReports']);
        Route::post('/{report}/resolve', [AdminController::class, 'resolveReport']);
        Route::post('/{report}/reject', [AdminController::class, 'rejectReport']);
    });
});