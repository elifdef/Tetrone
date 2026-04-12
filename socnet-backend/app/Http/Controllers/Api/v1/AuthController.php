<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserBasicResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    /**
     * Авторизація користувача
     *
     * @group Authentication
     * @unauthenticated
     * @response 200
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('login'),
            $request->validated('password'),
            $request
        );

        $user = $result['user'];
        $userData = new UserBasicResource($user)->resolve();
        $userData['email'] = $user->email;

        return response()->json([
            'success' => true,
            'code' => 'LOGIN_SUCCESS',
            'data' => [
                'token' => $result['token'],
                'user' => $userData
            ]
        ], 200);
    }

    /**
     * Реєстрація нового користувача
     *
     * @group Authentication
     * @unauthenticated
     * @response 201
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());

        $tokenResult = $user->createToken('auth_token');

        $userData = new UserBasicResource($user)->resolve();
        $userData['email'] = $user->email;

        return response()->json([
            'success' => true,
            'code' => 'REGISTER_SUCCESS',
            'data' => [
                'token' => $tokenResult->plainTextToken,
                'user' => $userData
            ]
        ], 201);
    }

    /**
     * Отримати активні сесії
     *
     * @group Authentication
     * @authenticated
     * @response 200
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

        return response()->json([
            'success' => true,
            'code' => 'SESSIONS_RETRIEVED',
            'data' => $sessions
        ], 200);
    }

    /**
     * Завершити конкретну сесію
     *
     * @group Authentication
     * @authenticated
     * @response 200
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();
        return response()->json(['success' => true, 'code' => 'SESSION_REVOKED'], 200);
    }

    /**
     * Завершити всі інші сесії
     *
     * @group Authentication
     * @authenticated
     * @response 200
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()->id;
        $request->user()->tokens()->where('id', '!=', $currentId)->delete();
        return response()->json(['success' => true, 'code' => 'ALL_OTHER_SESSIONS_REVOKED'], 200);
    }

    /**
     * Вихід (завершення поточної сесії)
     *
     * @group Authentication
     * @authenticated
     * @response 200
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'code' => 'LOGOUT_SUCCESS'], 200);
    }
}