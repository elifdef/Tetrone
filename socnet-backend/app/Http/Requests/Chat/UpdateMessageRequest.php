<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => 'nullable|string|max:4096',
            'deleted_media' => 'nullable|array',
            'deleted_media.*' => 'string',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,mp3,wav,pdf,doc,docx,zip,rar|max:' . config('uploads.max_size')
        ];
    }
}