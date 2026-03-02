<?php

use Illuminate\Support\Facades\Broadcast;

// дозволяємо юзеру слухати тільки свій приватний канал сповіщень
Broadcast::channel('App.Models.User.{id}', function ($user, $id)
{
    return (int)$user->id === (int)$id;
});