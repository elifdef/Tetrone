<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\StickerPackController;
use App\Http\Controllers\Api\v1\CustomStickerController;

Route::prefix('stickers')->group(function ()
{
    Route::get('/catalog', [StickerPackController::class, 'catalog']);
    Route::get('/search', [CustomStickerController::class, 'search']);
    Route::get('/{emoji}/info', [CustomStickerController::class, 'info']);

    Route::get('/my', [StickerPackController::class, 'myPacks']);

    Route::middleware('auth:sanctum')->group(function ()
    {
        Route::post('/packs', [StickerPackController::class, 'store']);
        Route::put('/packs/{pack}', [StickerPackController::class, 'update']);
        Route::delete('/packs/{pack}', [StickerPackController::class, 'destroy']);

        Route::post('/packs/{pack}/install', [StickerPackController::class, 'install']);
        Route::delete('/packs/{pack}/uninstall', [StickerPackController::class, 'uninstall']);
        Route::put('/reorder-packs', [StickerPackController::class, 'reorder']);

        Route::post('/packs/{pack}/items', [CustomStickerController::class, 'store']);
        Route::put('/packs/{pack}/reorder', [CustomStickerController::class, 'reorder']);
        Route::put('/{sticker}', [CustomStickerController::class, 'update']);
        Route::delete('/{sticker}', [CustomStickerController::class, 'destroy']);

        Route::post('/packs/{pack}/report', [StickerPackController::class, 'report']);
    });
});