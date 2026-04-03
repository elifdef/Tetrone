<?php

namespace App\Http\Requests\Sticker;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStickerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return !auth()->user()->is_banned;
    }

    public function rules(): array
    {
        $pack = $this->route('pack');

        return [
            'file' => 'required|file|mimes:webp,png|max:512',
            'shortcode' => [
                'required', 'string', 'min:2', 'max:30', 'regex:/^[a-zA-Z0-9_]+$/',
                Rule::unique('custom_stickers', 'shortcode')->where('pack_id', $pack ? $pack->id : null)
            ],
            'keywords' => 'nullable|string|max:255',
            'sort_order' => 'integer'
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            $pack = $this->route('pack');

            if ($pack && $pack->stickers()->count() >= 120)
            {
                $validator->errors()->add('file', 'ERR_PACK_FULL');
            }

            // обмеження на максимум 5 ключових слів
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