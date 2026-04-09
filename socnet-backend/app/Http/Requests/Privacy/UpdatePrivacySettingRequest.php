<?php

namespace App\Http\Requests\Privacy;

use App\Enums\PrivacyContext;
use App\Enums\PrivacyLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdatePrivacySettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'context' => ['required', new Enum(PrivacyContext::class)],
            'level' => ['required', new Enum(PrivacyLevel::class)],
        ];
    }
}