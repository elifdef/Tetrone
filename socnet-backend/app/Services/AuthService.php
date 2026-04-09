<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Http\Request;

class AuthService
{
    public function login(string $login, string $password, Request $request): array
    {
        $loginType = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $credentials = [
            $loginType => $login,
            'password' => $password
        ];

        if (!auth()->attempt($credentials))
        {
            throw new ApiException('ERR_INVALID_CREDENTIALS', 401);
        }

        $user = auth()->user();

        // Запобігаємо дублюванню сесій з одного і того ж браузера/IP
        $user->tokens()
            ->where('ip_address', $request->ip())
            ->where('user_agent', $request->userAgent())
            ->delete();

        $tokenResult = $user->createToken('auth_token');
        $tokenModel = $tokenResult->accessToken;

        $tokenModel->ip_address = $request->ip();
        $tokenModel->user_agent = $request->userAgent();
        $tokenModel->save();

        $user->loginHistories()->create([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return [
            'token' => $tokenResult->plainTextToken,
            'user' => $user
        ];
    }

    public function register(array $data): User
    {
        if (!config('features.allow_registration'))
        {
            throw new ApiException('ERR_REGISTRATION_SUSPENDED', 403);
        }

        $user = User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        if (config('features.need_confirm_email'))
        {
            $user->sendEmailVerificationNotification();
        }

        return $user;
    }
}