<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserBasicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'avatar' => $this->avatar,
            'gender' => $this->gender,
            'is_banned' => (bool)$this->is_banned,
            'personalization' => $this->personalization ? [
                'banner_image' => $this->personalization->banner_image ? asset("storage/" . $this->personalization->banner_image) : null,
                'banner_color' => $this->personalization->banner_color,
                'username_color' => $this->personalization->username_color,
            ] : null,
        ];
    }
}