<?php

namespace App\Http\Requests\Poll;

use Illuminate\Foundation\Http\FormRequest;

class VotePollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'option_ids' => 'required|array|min:1',
            'option_ids.*' => 'integer'
        ];
    }
}