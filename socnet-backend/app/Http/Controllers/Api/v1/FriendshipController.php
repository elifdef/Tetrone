<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Models\Friendship;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FriendshipController extends Controller
{
    public function __construct(protected FriendshipService $friendService)
    {
    }

    /**
     * Надіслати заявку в друзі
     *
     * @group Friendships
     * @authenticated
     * @response 201
     */
    public function sendRequest(Request $request, User $targetUser): JsonResponse
    {
        $this->friendService->sendRequest($request->user(), $targetUser);
        return response()->json(['success' => true, 'code' => 'FRIEND_REQUEST_SENT'], 201);
    }

    /**
     * Прийняти заявку в друзі
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function acceptRequest(Request $request, User $targetUser): JsonResponse
    {
        $this->friendService->acceptRequest($request->user(), $targetUser);
        return response()->json(['success' => true, 'code' => 'FRIEND_REQUEST_ACCEPTED'], 200);
    }

    /**
     * Видалити з друзів / Скасувати заявку
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function destroy(Request $request, User $targetUser): JsonResponse
    {
        $this->friendService->destroyFriendship($request->user(), $targetUser);
        return response()->json(['success' => true, 'code' => 'FRIEND_REMOVED'], 200);
    }

    /**
     * Заблокувати користувача
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function block(Request $request, User $targetUser): JsonResponse
    {
        $this->friendService->blockUser($request->user(), $targetUser);
        return response()->json(['success' => true, 'code' => 'USER_BLOCKED'], 200);
    }

    /**
     * Розблокувати користувача
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function unblock(Request $request, User $targetUser): JsonResponse
    {
        $this->friendService->unblockUser($request->user(), $targetUser);
        return response()->json(['success' => true, 'code' => 'USER_UNBLOCKED'], 200);
    }

    /**
     * Отримати список друзів
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function listFriends(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $friends = User::whereIn('id', $me->getAllFriendIds())->paginate(30);

        return PublicUserResource::collection($friends)->additional([
            'success' => true,
            'code' => 'FRIENDS_RETRIEVED'
        ]);
    }

    /**
     * Отримати лічильник заявок
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function getCounts(Request $request): JsonResponse
    {
        $me = $request->user();
        $requestsCount = Friendship::where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->count();

        return response()->json([
            'success' => true,
            'code' => 'FRIEND_COUNTS_RETRIEVED',
            'data' => ['requests_count' => $requestsCount]
        ], 200);
    }

    /**
     * Вихідні (надіслані) заявки
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function sentRequests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->paginate(30);

        return PublicUserResource::collection($users)->additional([
            'success' => true,
            'code' => 'SENT_REQUESTS_RETRIEVED'
        ]);
    }

    /**
     * Вхідні (отримані) заявки
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function requests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('sentFriendships', function ($q) use ($me)
        {
            $q->where('friend_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->paginate(30);

        return PublicUserResource::collection($users)->additional([
            'success' => true,
            'code' => 'INCOMING_REQUESTS_RETRIEVED'
        ]);
    }

    /**
     * Чорний список (Заблоковані)
     *
     * @group Friendships
     * @authenticated
     * @response 200
     */
    public function blocked(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_BLOCKED);
        })->paginate(30);

        return PublicUserResource::collection($users)->additional([
            'success' => true,
            'code' => 'BLOCKED_USERS_RETRIEVED'
        ]);
    }
}