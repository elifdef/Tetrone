<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Models\Friendship;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * @group Друзі та Блокування
 *
 * API для керування заявками в друзі, списком друзів та чорним списком.
 */
class FriendshipController extends Controller
{
    public function __construct(protected FriendshipService $friendService)
    {
    }

    /**
     * Надіслати заявку в друзі
     *
     * @urlParam username string required Нікнейм цільового користувача. Example: Tetrone_84
     * * @responseFile status=200 storage/responses/friend_success.json
     * @responseFile status=403 storage/responses/friend_error_403.json
     */
    public function sendRequest(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $result = $this->friendService->sendRequest($request->user(), $targetUser);

        if (is_array($result))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('FRIEND_REQUEST_SENT', 'Friend request sent');
    }

    /**
     * Прийняти заявку в друзі
     *
     * @urlParam username string required Нікнейм користувача, який надіслав заявку. Example: Tetrone_84
     * * @responseFile status=200 storage/responses/friend_success.json
     * @response 404 {"success": false, "code": "ERR_NO_PENDING_REQUEST", "message": "No pending request found"}
     */
    public function acceptRequest(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $success = $this->friendService->acceptRequest($request->user(), $targetUser);

        if (!$success)
        {
            return $this->error('ERR_NO_PENDING_REQUEST', 'No pending request found', 404);
        }

        return $this->success('FRIEND_REQUEST_ACCEPTED', 'Friend request accepted');
    }

    /**
     * Видалити з друзів або скасувати заявку
     *
     * @urlParam username string required Нікнейм цільового користувача. Example: Tetrone_84
     * * @responseFile status=200 storage/responses/friend_success.json
     */
    public function destroy(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        Friendship::between($request->user(), $targetUser)->delete();

        return $this->success('FRIEND_REMOVED', 'Relationship removed');
    }

    /**
     * Заблокувати користувача
     *
     * @urlParam username string required Нікнейм цільового користувача. Example: Tetrone_84
     * * @responseFile status=200 storage/responses/friend_success.json
     */
    public function block(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $result = $this->friendService->blockUser($request->user(), $targetUser);

        if (is_array($result))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('USER_BLOCKED', 'User blocked');
    }

    /**
     * Зняти блокування з користувача
     *
     * @urlParam username string required Нікнейм цільового користувача. Example: Tetrone_84
     * * @responseFile status=200 storage/responses/friend_success.json
     * @response 404 {"success": false, "code": "ERR_NOT_IN_BLACKLIST", "message": "User was not in blacklist"}
     */
    public function unblock(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $success = $this->friendService->unblockUser($request->user(), $targetUser);

        if (!$success)
        {
            return $this->error('ERR_NOT_IN_BLACKLIST', 'User was not in blacklist', 404);
        }

        return $this->success('USER_UNBLOCKED', 'User unblocked');
    }

    /**
     * Отримати список друзів
     *
     * @responseFile status=200 storage/responses/friend_list.json
     */
    public function listFriends(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $friendIds = $me->getAllFriendIds();
        $friends = User::whereIn('id', $friendIds)->get();

        return PublicUserResource::collection($friends);
    }

    /**
     * Отримати кількість вхідних заявок
     *
     * @responseFile status=200 storage/responses/friend_counts.json
     */
    public function getCounts(Request $request): JsonResponse
    {
        $me = $request->user();
        $requestsCount = Friendship::where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->count();

        return $this->success('SUCCESS', 'Counts retrieved', ['requests_count' => $requestsCount]);
    }

    /**
     * Отримати список надісланих мною заявок (підписок)
     *
     * @responseFile status=200 storage/responses/friend_list.json
     */
    public function sentRequests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->get();

        return PublicUserResource::collection($users);
    }

    /**
     * Отримати список вхідних заявок
     *
     * @responseFile status=200 storage/responses/friend_list.json
     */
    public function requests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('sentFriendships', function ($q) use ($me)
        {
            $q->where('friend_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->get();

        return PublicUserResource::collection($users);
    }

    /**
     * Отримати чорний список
     *
     * @responseFile status=200 storage/responses/friend_list.json
     */
    public function blocked(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_BLOCKED);
        })->get();

        return PublicUserResource::collection($users);
    }
}