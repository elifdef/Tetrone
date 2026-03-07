<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'message',
        'status',
        'moderator_id',
        'admin_response'
    ];

    // хто подав апеляцію
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // хто виніс вирішення
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
}