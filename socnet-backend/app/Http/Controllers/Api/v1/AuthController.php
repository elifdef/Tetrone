<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        // Якщо пароль не підійде, AuthService кине помилку і код нижче не виконається
        $result = $this->authService->login($request->email, $request->password, $request);

        return $this->success('LOGIN_SUCCESS', 'Login successful', $result);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        if (!config('features.allow_registration'))
        {
            return $this->error('ERR_REGISTRATION_SUSPENDED', 'New user registration is currently suspended', 403);
        }

        $user = $this->authService->register($request->validated());

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

        $sessions = $tokens->map(fn($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'ip_address' => $token->ip_address,
            'user_agent' => $token->user_agent,
            'last_used_at' => $token->last_used_at,
            'created_at' => $token->created_at,
            'is_current' => $token->id === $currentId
        ]);

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