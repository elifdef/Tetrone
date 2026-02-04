<?php

use App\Http\Controllers\Api\v1\FriendshipController;
use Illuminate\Support\Facades\Route;

// приватний маршрут який требує підтвердження пошти (180 запитів/мін)
Route::middleware(['auth:sanctum', 'verified', 'throttle:180,1'])
    ->prefix('friends')
    ->controller(FriendshipController::class)
    ->group(function ()
    {
        Route::get('/', 'listFriends');                 // список друзів
        Route::get('requests', 'requests');             // вхідні заявки
        Route::get('sent', 'sentRequests');             // вихідні заявки
        //Route::get('count', 'getCounts');                       // лічильник заявок

        Route::post('add', 'sendRequest');              // додати друга
        Route::post('accept', 'acceptRequest');         // прийняти друга
        Route::delete('{username}', 'destroy');         // видалити друга

        Route::get('blocked', 'blocked');               // список заблокованих
        Route::post('block', 'block');                  // заблокувати
        Route::delete('blocked/{username}', 'unblock'); // розблокувати
    });