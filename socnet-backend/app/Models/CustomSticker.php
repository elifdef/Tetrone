<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomSticker extends Model
{
    protected $table = 'custom_emojis';
    protected $guarded = [];

    public function pack()
    {
        return $this->belongsTo(StickerPack::class, 'pack_id');
    }

    public function favoritedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_favorite_emojis', 'emoji_id', 'user_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}