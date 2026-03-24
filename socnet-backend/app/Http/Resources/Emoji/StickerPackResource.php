<?php

namespace App\Http\Resources\Emoji;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StickerPackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'short_name' => $this->short_name,
            'cover_url' => $this->cover_path ? asset('storage/' . $this->cover_path) : asset('images/theme-modern-dark.png'),
            'is_published' => (bool)$this->is_published,
            'author' => $this->author ? $this->author->username : 'System',
            'emojis' => StickerResource::collection($this->whenLoaded('emojis')),
            'stickers_count' => $this->emojis_count ?? $this->emojis()->count(),
            'created_at' => $this->created_at,
        ];
    }
}