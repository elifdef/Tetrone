<?php

namespace App\Http\Requests\Emoji;

use Illuminate\Foundation\Http\FormRequest;

class StorePackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return !auth()->user()->is_banned;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|min:2|max:50',
            'cover' => 'nullable|file|mimes:webp,gif,png|max:512',
            'is_published' => 'boolean'
        ];
    }
}