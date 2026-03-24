<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'nullable|string',
            'entities' => 'nullable|string',
            'target_user_id' => 'nullable|exists:users,id',
            'original_post_id' => 'nullable|exists:posts,id',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm|max:' . config('uploads.max_size')
        ];
    }

    /**
     * Кастомна перевірка після базової валідації.
     * Пост не може бути абсолютно порожнім.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator)
        {
            $hasContent = !empty($this->input('content')) && $this->input('content') !== '""';
            $hasEntities = !empty($this->input('entities'));
            $hasMedia = $this->hasFile('media');
            $isRepost = !empty($this->input('original_post_id'));

            if (!$hasContent && !$hasEntities && !$hasMedia && !$isRepost)
            {
                $validator->errors()->add('content', 'Post cannot be empty. Add text, media, poll, or repost.');
            }
        });
    }
}