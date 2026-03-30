<?php

namespace App\Http\Requests\Post;

use Illuminate\Foundation\Http\FormRequest;
use App\Traits\SanitizesProseMirror;

class UpdatePostRequest extends FormRequest
{
    use SanitizesProseMirror;

    public function authorize(): bool
    {
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

    public function withValidator($validator): void
    {
        $validator->after(function ($validator)
        {
            $post = $this->route('post');
            $payload = $this->input('payload') ?? [];

            $hasText = false;
            if (array_key_exists('text', $payload))
            {
                if (is_array($payload['text']))
                {
                    $hasText = $this->hasActualContent($payload['text']);
                } else
                {
                    $hasText = trim((string)$payload['text']) !== '';
                }
            } else
            {
                $postContent = is_array($post->content) ? $post->content : [];
                $hasText = !empty($postContent['text']);
            }

            $hasPoll = isset($payload['poll']) ? true : (is_array($post->content) && isset($post->content['poll']));

            $currentMediaCount = $post->attachments()->count();
            $deletedMediaCount = count($this->input('deleted_media') ?? []);
            $newMediaCount = $this->hasFile('media') ? count($this->file('media')) : 0;
            $mediaLeft = ($currentMediaCount - $deletedMediaCount) + $newMediaCount;

            $isRepost = $post->is_repost;

            if (!$hasText && !$hasPoll && $mediaLeft <= 0 && !$isRepost)
            {
                $validator->errors()->add('payload', 'Post cannot be empty. Add text, media, poll, or repost.');
            }
        });
    }

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