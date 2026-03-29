<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\ChatEncryptionService;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $chat = $this->chat;

        $payload = ChatEncryptionService::decryptPayload($this->encrypted_payload, $chat->encrypted_dek);

        if ($payload === null)
        {
            $payload = [
                'text' => 'Message unavailable (decryption failed)',
                'files' => []
            ];
        }

        $secureFiles = array_map(fn($f) => [
            'name' => $f,
            'url' => url("/api/v1/chat/{$chat->slug}/files/" . $f)
        ], $payload['files'] ?? []);

        $replyToData = null;
        if ($this->relationLoaded('repliedMessage') && $this->repliedMessage)
        {
            $replyPayload = ChatEncryptionService::decryptPayload($this->repliedMessage->encrypted_payload, $chat->encrypted_dek);
            $replyToData = [
                'id' => $this->repliedMessage->id,
                'text' => $replyPayload['text'] ?? 'Media',
                'sender_name' => current(explode(' ', $this->repliedMessage->sender->first_name))
            ];
        }

        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'text' => $payload['text'] ?? '',
            'files' => $secureFiles,
            'shared_post' => ($this->shared_post_id && $this->relationLoaded('sharedPost') && $this->sharedPost)
                ? (new PostResource($this->sharedPost))->resolve()
                : null,
            'reply_to' => $replyToData,
            'is_pinned' => $this->is_pinned,
            'created_at' => $this->created_at,
            'is_edited' => $this->is_edited,
            'edited_at' => $this->is_edited ? $this->updated_at : null,
            'isMine' => $this->sender_id === $request->user()->id,
            'read_at' => $this->read_at,
        ];
    }
}