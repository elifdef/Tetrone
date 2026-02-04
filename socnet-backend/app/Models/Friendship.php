<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Friendship extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'friend_id', 'status'];

    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_BLOCKED = 'blocked';

    // для пошуку зв'язку між двома юзерами
    public function scopeBetween(Builder $query, $userA, $userB)
    {
        // Отримуємо ID якщо передали об'єкти
        $idA = $userA instanceof User ? $userA->id : $userA;
        $idB = $userB instanceof User ? $userB->id : $userB;

        return $query->where(function ($q) use ($idA, $idB)
        {
            $q->where('user_id', $idA)->where('friend_id', $idB);
        })->orWhere(function ($q) use ($idA, $idB)
        {
            $q->where('user_id', $idB)->where('friend_id', $idA);
        });
    }
}