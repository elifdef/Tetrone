<?php

namespace App\Http\Requests\Sticker;

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
            'shortcode' => 'required|string|min:2|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:custom_stickers,shortcode',
            'keywords' => 'nullable|string|max:255',
            'sort_order' => 'integer'
        ];
    }

    /**
     * Кастомна валідація на ліміт стікерів у паку
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            $pack = $this->route('pack');

            if ($pack && $pack->stickers()->count() >= 120)
            {
                $validator->errors()->add('file', 'ERR_PACK_FULL');
            }
        });
    }
}