<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uid' => $this->uid,
            'post_id' => $this->post_id,
            'content' => $this->content,
            'created_at' => $this->created_at->toISOString(),
            'user' => new UserBasicResource($this->whenLoaded('user')),
            'post' => new PostResource($this->whenLoaded('post'))
        ];
    }
}
