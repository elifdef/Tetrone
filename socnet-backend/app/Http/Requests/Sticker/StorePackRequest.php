<?php

namespace App\Http\Requests\Sticker;

use App\Models\StickerPack;
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
            'is_published' => 'boolean',
            'cover' => 'nullable|image|mimes:jpeg,png,webp|max:2048'
        ];
    }

    /**
     * Перевірка на ліміт створених паків (Максимум 255)
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator)
        {
            $createdPacksCount = StickerPack::where('author_id', $this->user()->id)->count();

            if ($createdPacksCount >= 255)
            {
                $validator->errors()->add('title', 'ERR_MAX_PACKS_REACHED');
            }
        });
    }
}