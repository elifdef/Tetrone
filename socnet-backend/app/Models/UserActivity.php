<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivity extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'date',
        'active_seconds',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}