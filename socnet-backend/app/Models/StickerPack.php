<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StickerPack extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function stickers()
    {
        return $this->hasMany(CustomSticker::class, 'pack_id')->orderBy('sort_order');
    }

    public function installedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_sticker_packs', 'pack_id', 'user_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}