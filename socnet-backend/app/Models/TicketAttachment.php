<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class TicketAttachment extends Model
{
    protected $fillable = ['ticket_message_id', 'file_path', 'file_name', 'file_type', 'file_size'];

    protected function fileUrl(): Attribute
    {
        return Attribute::make(get: fn() => asset('storage/' . $this->file_path));
    }

    protected $appends = ['file_url'];
}