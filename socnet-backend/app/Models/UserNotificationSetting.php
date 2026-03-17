<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'notify_likes', 'sound_likes',
        'notify_comments', 'sound_comments',
        'notify_reposts', 'sound_reposts',
        'notify_friend_requests', 'sound_friend_requests',
        'notify_messages', 'sound_messages',
        'notify_wall_posts', 'sound_wall_posts',
    ];

    protected $casts = [
        'notify_wall_posts' => 'boolean',
        'notify_likes' => 'boolean',
        'notify_comments' => 'boolean',
        'notify_reposts' => 'boolean',
        'notify_friend_requests' => 'boolean',
        'notify_messages' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}