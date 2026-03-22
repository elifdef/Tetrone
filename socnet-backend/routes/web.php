<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function ()
{
    return response()->json([
        'name' => 'Tetrone API',
        'version' => '1.0'
    ]);
});