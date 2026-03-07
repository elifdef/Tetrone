<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id', 'reportable_type', 'reportable_id',
        'reason', 'details', 'status', 'moderator_id', 'admin_response'
    ];

    // поліморфний звязок (щоб дістати пост, юзера або комент)
    public function reportable()
    {
        return $this->morphTo();
    }

    // хто поскаржився
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // хто розглянув
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
}