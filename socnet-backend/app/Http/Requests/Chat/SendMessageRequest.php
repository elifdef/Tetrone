<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => 'nullable|string|max:65536',
            'shared_post_id' => 'nullable|exists:posts,id',
            'reply_to_id' => 'nullable|exists:messages,id',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,mp3,wav,pdf,doc,docx,zip,rar|max:' . config('uploads.max_size')
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            if (empty($this->text) && empty($this->media) && empty($this->shared_post_id))
            {
                $validator->errors()->add('text', 'Message cannot be empty');
            }
        });
    }
}