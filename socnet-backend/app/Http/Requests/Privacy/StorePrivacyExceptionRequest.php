<?php

namespace App\Http\Requests\Privacy;

use App\Enums\PrivacyContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StorePrivacyExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_user_id' => 'required|integer|exists:users,id',
            'context' => ['required', new Enum(PrivacyContext::class)],
            'is_allowed' => 'required|boolean',
        ];
    }
}