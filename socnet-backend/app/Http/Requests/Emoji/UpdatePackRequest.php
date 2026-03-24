<?php

namespace App\Http\Requests\Emoji;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|min:3|max:50',
            'cover' => 'nullable|file|mimes:webp,gif,png|max:512',
            'is_published' => 'boolean'
        ];
    }
}