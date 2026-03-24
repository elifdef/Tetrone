<?php

namespace App\Http\Requests\Emoji;

use Illuminate\Foundation\Http\FormRequest;

class StoreStickerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return !auth()->user()->is_banned;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:webp,gif,png|max:512',
            'shortcode' => 'required|string|min:2|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:custom_emojis,shortcode',
            'keywords' => 'nullable|string|max:255',
            'sort_order' => 'integer'
        ];
    }
}