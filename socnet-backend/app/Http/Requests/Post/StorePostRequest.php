<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = $this->input('payload');

        $this->merge([
            'payload' => is_string($payload) ? json_decode($payload, true) : $payload,
        ]);
    }

    public function rules(): array
    {
        return [
            'payload' => 'nullable|array',
            'target_user_id' => 'nullable|exists:users,id',
            'original_post_id' => 'nullable|exists:posts,id',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,m4a,mp3,wav,pdf,doc,docx|max:' . config('uploads.max_size')
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator)
        {
            $payload = $this->input('payload') ?? [];

            $hasText = !empty($payload['text']);
            $hasPoll = !empty($payload['poll']);
            $hasMedia = $this->hasFile('media');
            $isRepost = !empty($this->input('original_post_id'));

            if (!$hasText && !$hasPoll && !$hasMedia && !$isRepost)
            {
                $validator->errors()->add('payload', 'Post cannot be empty. Add text, media, poll, or repost.');
            }
        });
    }
}