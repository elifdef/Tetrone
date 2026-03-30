<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Comment extends Model
{
    protected $fillable = [
        'post_id',
        'user_id',
        'content'
    ];

    protected $casts = [
        'content' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($comment)
        {
            if (empty($comment->uid))
            {
                $comment->uid = Str::random(12);
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uid';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}