<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => 'required|string',
            'password' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'ERR_LOGIN_REQUIRED',
            'password.required' => 'ERR_PASSWORD_REQUIRED',
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