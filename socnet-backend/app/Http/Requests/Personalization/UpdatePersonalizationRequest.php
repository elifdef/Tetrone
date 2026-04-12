<?php

namespace App\Http\Requests\Personalization;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersonalizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'banner_color' => [
                'nullable', 'string', 'max:150',
                'regex:/^(#[0-9A-Fa-f]{3,8}|(rgb|rgba|hsl|hsla)\(.*?\)|linear-gradient\(.*?\))$/'
            ],
            'username_color' => [
                'nullable', 'string', 'max:50',
                'regex:/^(#[0-9A-Fa-f]{3,8}|(rgb|rgba|hsl|hsla)\(.*?\))$/'
            ],
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_banner_image' => 'nullable|string'
        ];
    }
}