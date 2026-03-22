<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Авторизація та Акаунт
 *
 * API для реєстрації, входу та керування сесіями (пристроями).
 */
class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    /**
     * Увійти в акаунт
     *
     * Аутентифікація користувача за email та паролем. Повертає токен доступу та базові дані користувача.
     *
     * @unauthenticated
     * * @response 200 {
     * "success": true,
     * "code": "LOGIN_SUCCESS",
     * "message": "Login successful",
     * "data": {
     * "token": "1|laravel_sanctum_token_string_here...",
     * "user": {
     * "id": 1,
     * "username": "Tetrone_84",
     * "email": "hello@netq84.com",
     * "avatar": null
     * }
     * }
     * }
     * @response 401 {
     * "success": false,
     * "code": "ERR_INVALID_CREDENTIALS",
     * "message": "Invalid credentials"
     * }
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Якщо пароль не підійде, AuthService кине помилку і код нижче не виконається
        $result = $this->authService->login($request->email, $request->password, $request);

        return $this->success('LOGIN_SUCCESS', 'Login successful', $result);
    }

    /**
     * Реєстрація нового користувача
     *
     * Створює новий акаунт. Якщо реєстрація закрита в налаштуваннях сервера (features.allow_registration), запит буде відхилено.
     *
     * @unauthenticated
     * * @response 201 {
     * "success": true,
     * "code": "REGISTER_SUCCESS",
     * "message": "User registered successfully. Please check your email.",
     * "data": {
     * "user_id": 1
     * }
     * }
     * @response 403 {
     * "success": false,
     * "code": "ERR_REGISTRATION_SUSPENDED",
     * "message": "New user registration is currently suspended"
     * }
     */
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
     * Отримати список активних сесій
     *
     * Повертає список усіх пристроїв (токенів), з яких користувач зараз авторизований у системі.
     *
     * @response 200 {
     * "success": true,
     * "code": "SESSIONS_RETRIEVED",
     * "message": "Sessions retrieved",
     * "data": [
     * {
     * "id": 1,
     * "name": "Windows_Chrome",
     * "ip_address": "192.168.1.1",
     * "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
     * "last_used_at": "2026-03-22T20:12:52.000000Z",
     * "created_at": "2026-03-22T10:00:00.000000Z",
     * "is_current": true
     * }
     * ]
     * }
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
     *
     * Завершує сеанс для вказаного ID токена (примусово розлогінює користувача на іншому пристрої).
     *
     * @urlParam tokenId integer required ID сесії (токена) для видалення. Example: 2
     * * @response 200 {
     * "success": true,
     * "code": "SESSION_REVOKED",
     * "message": "Session revoked successfully"
     * }
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();
        return $this->success('SESSION_REVOKED', 'Session revoked successfully');
    }

    /**
     * Видалити всі сесії ОКРІМ поточної
     *
     * Корисно, якщо користувач підозрює несанкціонований доступ до акаунта. Завершує всі інші активні сеанси на всіх пристроях.
     *
     * @response 200 {
     * "success": true,
     * "code": "ALL_OTHER_SESSIONS_REVOKED",
     * "message": "All other sessions revoked successfully"
     * }
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->id;
        $request->user()->tokens()->where('id', '!=', $currentId)->delete();
        return $this->success('ALL_OTHER_SESSIONS_REVOKED', 'All other sessions revoked successfully');
    }

    /**
     * Вихід з акаунта
     *
     * Видаляє поточний токен доступу (розлогінює поточний пристрій).
     *
     * @response 200 {
     * "success": true,
     * "code": "LOGOUT_SUCCESS",
     * "message": "Logged out successfully"
     * }
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success('LOGOUT_SUCCESS', 'Logged out successfully');
    }
}