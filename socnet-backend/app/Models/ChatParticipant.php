<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatParticipant extends Model
{
    use SoftDeletes;

    protected $guarded = [];
    protected $fillable = ['chat_id', 'user_id', 'last_read_message_id'];

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}