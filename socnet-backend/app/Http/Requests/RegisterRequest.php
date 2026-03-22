<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => [
                'required', 'string', 'min:4', 'max:32', 'unique:users', 'regex:/^[A-Za-z0-9_]+$/',
                Rule::notIn(config('reserved.usernames', []))
            ],
            'email' => 'required|email|unique:users',
            'password' => [
                'required', 'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols()
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'username.not_in' => 'This username is reserved or not allowed.'
        ];
    }
}
