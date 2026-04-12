<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'unique:users,username',
                'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/'
            ],
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'ERR_USERNAME_TAKEN',
            'email.unique' => 'ERR_EMAIL_TAKEN',
            'username.min' => 'ERR_USERNAME_TOO_SHORT',
            'password.min' => 'ERR_PASSWORD_TOO_SHORT',
            'password.confirmed' => 'ERR_PASSWORD_MISMATCH',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        $firstError = $validator->errors()->first();

        $code = str_starts_with($firstError, 'ERR_') ? $firstError : 'ERR_VALIDATION';

        throw new HttpResponseException(response()->json([
            'success' => false,
            'code' => $code,
            'message' => $firstError,
            'data' => $validator->errors()
        ], 422));
    }
}