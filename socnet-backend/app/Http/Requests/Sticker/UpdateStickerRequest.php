<?php

namespace App\Http\Requests\Sticker;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStickerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && !auth()->user()->is_banned;
    }

    public function rules(): array
    {
        $sticker = $this->route('sticker');
        $stickerId = $sticker ? $sticker->id : null;

        return [
            'file' => 'nullable|file|mimes:webp,gif,png|max:512',
            'shortcode' => 'sometimes|string|min:2|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:custom_stickers,shortcode,' . $stickerId,

            'keywords' => 'nullable|string|max:255'
        ];
    }
}