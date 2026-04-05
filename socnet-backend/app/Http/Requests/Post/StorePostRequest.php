<?php

namespace App\Http\Requests\Post;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use App\Traits\SanitizesProseMirror;

class StorePostRequest extends FormRequest
{
    use SanitizesProseMirror;

    public function authorize(): bool
    {
        $targetUserId = $this->input('target_user_id');
        $originalPostId = $this->input('original_post_id');

        // Перевірка прав на стіну
        if ($targetUserId && $targetUserId != $this->user()->id)
        {
            $targetUser = User::findOrFail($targetUserId);
            if (!$this->user()->can('writeOnWall', $targetUser))
            {
                return false;
            }
        }

        // Перевірка прав на репост
        if ($originalPostId)
        {
            $originalPost = Post::findOrFail($originalPostId);
            if (!$this->user()->can('repost', $originalPost))
            {
                return false;
            }
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = $this->input('payload');
        $payloadArray = is_string($payload) ? json_decode($payload, true) : $payload;

        if (is_array($payloadArray) && isset($payloadArray['text']) && is_array($payloadArray['text']))
        {
            $payloadArray['text'] = $this->sanitizeProseMirrorNode($payloadArray['text']);
        }

        $this->merge([
            'payload' => $payloadArray,
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

            $hasText = false;
            if (!empty($payload['text']))
            {
                $hasText = is_array($payload['text'])
                    ? $this->hasActualContent($payload['text'])
                    : trim((string)$payload['text']) !== '';
            }

            $hasPoll = !empty($payload['poll']);
            $hasMedia = $this->hasFile('media');
            $isRepost = !empty($this->input('original_post_id'));

            if (!$hasText && !$hasPoll && !$hasMedia && !$isRepost)
            {
                $validator->errors()->add('payload', 'Post cannot be empty. Add text, media, poll, or repost.');
            }
        });
    }

    // Рекурсивно шукаємо текст або стікер у масиві ProseMirror
    private function hasActualContent(array $node): bool
    {
        if (isset($node['type']) && in_array($node['type'], ['text', 'customSticker', 'mention']))
        {
            return true;
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            foreach ($node['content'] as $child)
            {
                if (is_array($child) && $this->hasActualContent($child))
                {
                    return true;
                }
            }
        }

        return false;
    }
}