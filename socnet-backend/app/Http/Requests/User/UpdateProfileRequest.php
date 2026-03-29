<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'bio' => 'nullable|string|max:1000',
            'last_name' => 'nullable|string|min:3|max:50',
            'avatar' => 'nullable|image|max:' . config('uploads.max_size'),
            'country' => 'nullable|string|size:2|alpha',
            'gender' => 'nullable|integer|in:1,2',
            'remove_avatar' => 'nullable|boolean',
            'finish_setup' => 'nullable|boolean'
        ];

        if ($this->boolean('finish_setup'))
        {
            $rules['first_name'] = 'required|string|min:3|max:50';
            $rules['birth_date'] = 'required|date';
        } else
        {
            $rules['first_name'] = 'nullable|string|min:3|max:50';
            $rules['birth_date'] = 'nullable|date';
        }

        return $rules;
    }
}