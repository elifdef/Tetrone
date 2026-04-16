<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\SupportController;

Route::middleware(['auth:sanctum'])->prefix('support')->group(function ()
{
    Route::get('/tickets', [SupportController::class, 'index']);
    Route::post('/tickets', [SupportController::class, 'store']);
    Route::get('/tickets/{ticket}', [SupportController::class, 'show']);
    Route::post('/tickets/{ticket}/reply', [SupportController::class, 'reply']);
    Route::get('/categories', [SupportController::class, 'getCategories']);
});