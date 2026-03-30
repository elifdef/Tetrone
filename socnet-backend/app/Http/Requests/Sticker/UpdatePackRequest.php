<?php

namespace App\Http\Requests\Sticker;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->has('is_published'))
        {
            $this->merge(['is_published' => $this->boolean('is_published')]);
        }
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