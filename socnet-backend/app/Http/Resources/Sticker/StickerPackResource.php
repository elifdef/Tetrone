<?php

namespace App\Http\Resources\Sticker;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StickerPackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user('sanctum');

        $isOwner = $user ? $this->author_id === $user->id : false;

        $isInstalled = $user
            ? $user->installedStickerPacks()->where('pack_id', $this->id)->exists()
            : false;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'short_name' => $this->short_name,
            'cover_url' => $this->cover_path ? asset('storage/' . $this->cover_path) : null,
            'is_published' => (bool)$this->is_published,
            'author' => $this->author ? $this->author->username : 'System',
            'stickers' => StickerResource::collection($this->whenLoaded('stickers')),
            'stickers_count' => $this->stickers_count ?? $this->stickers()->count(),
            'is_owner' => $isOwner,
            'is_installed' => $isInstalled,
            'created_at' => $this->created_at,
        ];
    }
}