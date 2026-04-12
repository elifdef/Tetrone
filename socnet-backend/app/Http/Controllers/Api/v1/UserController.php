<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UpdateEmailRequest;
use App\Http\Requests\User\UpdatePasswordRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
    }

    /**
     * Отримати список користувачів (Пошук)
     *
     * @group Users
     * @response 200 storage/responses/users_list.json
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = $this->userService->getPaginatedUsers(
            $request->user('sanctum'),
            $request->input('search')
        );

        return PublicUserResource::collection($users)->additional([
            'success' => true,
            'code' => 'SUCCESS'
        ]);
    }

    /**
     * Отримати профіль користувача
     *
     * @group Users
     * @urlParam user string required Нікнейм користувача. Example: andrew
     * @response 200 storage/responses/user_profile.json
     */
    public function show(Request $request, User $user): PublicUserResource
    {
        $currentUser = $request->user('sanctum');
        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $user->id))
        {
            abort(404);
        }

        return new PublicUserResource($user)->additional([
            'success' => true,
            'code' => 'SUCCESS'
        ]);
    }

    /**
     * Оновити профіль
     *
     * @group Users
     * @authenticated
     * @urlParam user string required Нікнейм користувача. Example: andrew
     * @response 200 storage/responses/profile_updated.json
     */
    public function update(UpdateProfileRequest $request, User $user): JsonResponse
    {
        $this->authorize('updateProfile', $user);

        $this->userService->updateProfile(
            $user,
            $request->validated(),
            $request->file('avatar')
        );

        return response()->json([
            'success' => true,
            'code' => 'PROFILE_UPDATED'
        ], 200);
    }

    /**
     * Змінити email
     *
     * @group Users
     * @authenticated
     * @response 200
     */
    public function updateEmail(UpdateEmailRequest $request): JsonResponse
    {
        $this->userService->updateEmail($request->user(), $request->validated('email'));

        return response()->json([
            'success' => true,
            'code' => 'EMAIL_UPDATED'
        ], 200);
    }

    /**
     * Змінити пароль
     *
     * @group Users
     * @authenticated
     * @response 200
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->userService->updatePassword($request->user(), $request->validated('password'));

        return response()->json([
            'success' => true,
            'code' => 'PASSWORD_UPDATED'
        ], 200);
    }
}