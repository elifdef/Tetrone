<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
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
            'media' => 'nullable|array|max:10',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,webm,m4a,mp3,wav,pdf,doc,docx|max:' . config('uploads.max_size'),
            'deleted_media' => 'nullable|array',
            'deleted_media.*' => 'integer|exists:post_attachments,id'
        ];
    }

    /**
     * перевірка щоб пост не став порожнім після видалення тексту та файлів
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator)
        {
            $post = $this->route('post');
            $payload = $this->input('payload') ?? [];

            // чи є текст у новому payload?
            $hasText = !empty($payload['text']);

            // чи є опитування?
            $hasPoll = isset($payload['poll']) ? true : (is_array($post->content) && isset($post->content['poll']));

            // Було - Видалили + Завантажили нові
            $currentMediaCount = $post->attachments()->count();
            $deletedMediaCount = count($this->input('deleted_media') ?? []);
            $newMediaCount = $this->hasFile('media') ? count($this->file('media')) : 0;
            $mediaLeft = ($currentMediaCount - $deletedMediaCount) + $newMediaCount;

            // чи це репост? (пусті репости дозволені)
            $isRepost = $post->is_repost;

            if (!$hasText && !$hasPoll && $mediaLeft <= 0 && !$isRepost)
            {
                $validator->errors()->add('payload', 'Post cannot be empty. Add text, media, poll, or repost.');
            }
        });
    }
}