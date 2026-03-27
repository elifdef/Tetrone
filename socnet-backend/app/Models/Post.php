<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'target_user_id',
        'content',
        'original_post_id',
        'is_repost',
        'can_comment'
    ];

    protected $keyType = 'string';
    public $incrementing = false;
    protected $casts = [
        'content' => 'array',
        'is_repost' => 'boolean',
        'can_comment' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model)
        {
            if (empty($model->id))
                $model->id = Str::lower(Str::random(16));
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function isLikedBy(User $user)
    {
        return $this->likes()->where('user_id', $user->id)->exists();
    }

    public function originalPost()
    {
        return $this->belongsTo(Post::class, 'original_post_id');
    }

    public function reposts()
    {
        return $this->hasMany(Post::class, 'original_post_id');
    }

    public function attachments()
    {
        return $this->hasMany(PostAttachment::class);
    }

    public function pollVotes()
    {
        return $this->hasMany(PollVote::class);
    }

    public function myPollVotes()
    {
        return $this->hasMany(PollVote::class)
            ->where('user_id', auth('sanctum')->id());
    }
}