<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UpdateEmailRequest;
use App\Http\Requests\User\UpdatePasswordRequest;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $users = $this->userService->getPaginatedUsers(
            $request->user(),
            $request->input('search')
        );

        return PublicUserResource::collection($users);
    }

    public function show(string $username): array
    {
        $user = $this->userService->getUserByUsername($username);

        return (new PublicUserResource($user))->resolve();
    }

    public function update(UpdateProfileRequest $request, string $username): JsonResponse
    {
        $targetUser = $this->userService->getUserByUsername($username);

        if ($request->user()->id !== $targetUser->id)
        {
            return $this->error('ERR_ACCESS_DENIED', 'Access denied.', 403);
        }

        $updated = $this->userService->updateProfile(
            $targetUser,
            $request->validated(),
            $request->file('avatar')
        );

        if (!$updated)
        {
            return $this->error('ERR_NOTHING_TO_UPDATE', 'Nothing to update', 418);
        }

        return $this->success('PROFILE_UPDATED', 'Profile updated successfully');
    }

    public function updateEmail(UpdateEmailRequest $request): JsonResponse
    {
        if (!Hash::check($request->password, $request->user()->password))
        {
            return $this->error('ERR_INVALID_PASSWORD', 'Invalid password', 422);
        }

        $this->userService->updateEmail($request->user(), $request->email);

        return $this->success('EMAIL_UPDATED', 'Email changed. Please confirm your new address.');
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->userService->updatePassword($request->user(), $request->password);

        return $this->success('PASSWORD_UPDATED', 'Password has been changed.');
    }
}