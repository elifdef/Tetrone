<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationOverride extends Model
{
    protected $fillable = [
        'user_id',
        'target_user_id',
        'is_muted',
        'custom_sound',
    ];

    protected $casts = [
        'is_muted' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}