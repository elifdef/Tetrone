<?php

namespace App\Http\Requests\Sticker;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStickerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && !auth()->user()->is_banned;
    }

    public function rules(): array
    {
        $sticker = $this->route('sticker');

        return [
            'file' => 'nullable|file|mimes:webp,png|max:512',
            'shortcode' => [
                'sometimes',
                'string',
                'min:2',
                'max:30',
                'regex:/^[a-zA-Z0-9_]+$/',
                Rule::unique('custom_stickers', 'shortcode')
                    ->where('pack_id', $sticker ? $sticker->pack_id : null)
                    ->ignore($sticker ? $sticker->id : null)
            ],
            'keywords' => 'nullable|string|max:255'
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            $keywords = $this->input('keywords');
            if ($keywords)
            {
                $tagsArray = array_filter(array_map('trim', explode(',', $keywords)));
                if (count($tagsArray) > 5)
                {
                    $validator->errors()->add('keywords', 'You can provide a maximum of 5 tags.');
                }
            }
        });
    }
}