<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contentMap = is_array($this->content) ? $this->content : [];

        return [
            'id' => $this->id,
            'content' => $contentMap['text'] ?? null,

            'is_avatar_update' => $contentMap['is_avatar_update'] ?? false,
            'youtube_settings' => $contentMap['youtube'] ?? [],

            'poll' => $this->when(isset($contentMap['poll']), new PollResource($this)),
            'original_post_id' => $this->original_post_id,
            'attachments' => $this->whenLoaded('attachments', function ()
            {
                return $this->attachments->map(function ($attachment)
                {
                    return [
                        'id' => $attachment->id,
                        'type' => $attachment->type,
                        'url' => $attachment->file_url,
                        'sort_order' => $attachment->sort_order,
                        'file_name' => $attachment->file_name,
                        'file_size' => $attachment->file_size
                    ];
                });
            }),
            'created_at' => $this->created_at->toISOString(),
            'user' => new UserBasicResource($this->whenLoaded('user')),
            'target_user' => new UserBasicResource($this->whenLoaded('targetUser')),
            'likes_count' => $this->likes_count ?? 0,
            'comments_count' => $this->comments_count ?? 0,
            'reposts_count' => $this->reposts_count ?? 0,
            'is_liked' => (bool)$this->is_liked,
            'original_post' => new PostResource($this->whenLoaded('originalPost')),
            'is_repost' => (bool)$this->is_repost
        ];
    }
}