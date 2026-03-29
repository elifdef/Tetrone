<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
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
        $result = $this->authService->login(
            $request->validated('login'),
            $request->validated('password'),
            $request
        );

        if (!$result)
        {
            return $this->error('ERR_INVALID_CREDENTIALS', '', 401);
        }

        return $this->success('LOGIN_SUCCESS', '', $result);
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

    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();
        return $this->success('SESSION_REVOKED', 'Session revoked successfully');
    }

    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->id;
        $request->user()->tokens()->where('id', '!=', $currentId)->delete();
        return $this->success('ALL_OTHER_SESSIONS_REVOKED', 'All other sessions revoked successfully');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success('LOGOUT_SUCCESS', 'Logged out successfully');
    }
}