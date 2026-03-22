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
            'content' => 'nullable|string|max:65536',
            'target_user_id' => 'nullable|exists:users,id',
            'original_post_id' => 'nullable|exists:posts,id',
            'entities' => 'nullable|json',
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm|max:' . config('uploads.max_size', 51200)
        ];
    }

    // пост не може бути абсолютно порожнім
    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            if (empty($this->content) && empty($this->media) && empty($this->original_post_id))
            {
                $validator->errors()->add('content', 'Post cannot be empty. Add text, media, or repost.');
            }
        });
    }
}