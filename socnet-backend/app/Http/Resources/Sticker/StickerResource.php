<?php

namespace App\Http\Resources\Sticker;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StickerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shortcode' => $this->shortcode,
            'url' => asset('storage/' . $this->file_path),
            'keywords' => $this->keywords,
            'sort_order' => $this->sort_order,
        ];
    }
}