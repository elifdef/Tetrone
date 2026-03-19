<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * вхід в аккаунт
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password))
        {
            return $this->error('ERR_INVALID_CREDENTIALS', 'Invalid email or password', 401);
        }

        $tokenResult = $user->createToken('auth_token');

        $tokenModel = $tokenResult->accessToken;
        $tokenModel->ip_address = $request->ip();
        $tokenModel->user_agent = $request->userAgent();
        $tokenModel->save();

        // для записування хто зайшов
        $user->loginHistories()->create([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->success('LOGIN_SUCCESS', 'Login successful', [
            'token' => $tokenResult->plainTextToken
        ]);
    }

    /**
     * реєстрація
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        if (!config('features.allow_registration'))
        {
            return $this->error('ERR_REGISTRATION_SUSPENDED', 'New user registration is currently suspended', 403);
        }

        $validated = $request->validate([
            'username' => [
                'required',
                'string',
                'min:4',
                'max:32',
                'unique:users',
                'regex:/^[A-Za-z0-9_]+$/',
                Rule::notIn(config('reserved.usernames', []))
            ],
            'email' => 'required|email|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ]
        ], [
            'username.not_in' => 'This username is reserved or not allowed.'
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        if (config('features.need_confirm_email'))
        {
            $user->sendEmailVerificationNotification();
        }

        return $this->success('REGISTER_SUCCESS', 'User registered successfully. Please check your email.', [
            'user_id' => $user->id
        ], 201);
    }

    /**
     * Отримати список активних сесій (токенів)
     */
    public function getSessions(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->orderBy('last_used_at', 'desc')->get();
        $currentId = $request->user()->currentAccessToken()->id;

        $sessions = $tokens->map(function ($token) use ($currentId)
        {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'ip_address' => $token->ip_address,
                'user_agent' => $token->user_agent,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
                'is_current' => $token->id === $currentId
            ];
        });

        return $this->success('SESSIONS_RETRIEVED', 'Sessions retrieved', $sessions);
    }

    /**
     * Видалити конкретну сесію (токен)
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();
        return $this->success('SESSION_REVOKED', 'Session revoked successfully');
    }

    /**
     * Видалити всі сесії ОКРІМ поточної
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->id;
        $request->user()->tokens()->where('id', '!=', $currentId)->delete();
        return $this->success('ALL_OTHER_SESSIONS_REVOKED', 'All other sessions revoked successfully');
    }

    /**
     * вихід з аккаунта
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success('LOGOUT_SUCCESS', 'Logged out successfully');
    }
}