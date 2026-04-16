<?php

namespace App\Models;

use App\Enums\TicketCategory;
use App\Enums\TicketSubcategory;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $fillable = [
        'user_id', 'assigned_to', 'subject', 'category',
        'subcategory', 'status', 'priority', 'meta_data'
    ];

    protected $casts = [
        'category' => TicketCategory::class,
        'subcategory' => TicketSubcategory::class,
        'status' => TicketStatus::class,
        'meta_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class);
    }
}