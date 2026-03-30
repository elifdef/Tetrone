<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Models\Friendship;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendshipController extends Controller
{
    public function __construct(protected FriendshipService $friendService)
    {
    }

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

    public function destroy(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        Friendship::between($request->user(), $targetUser)->delete();

        return $this->success('FRIEND_REMOVED', 'Relationship removed');
    }

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

    public function listFriends(Request $request): JsonResponse
    {
        $me = $request->user();
        $friendIds = $me->getAllFriendIds();

        $friends = User::whereIn('id', $friendIds)->paginate(30);

        return $this->success('FRIENDS_RETRIEVED', 'Friends list retrieved',
            PublicUserResource::collection($friends)->response()->getData(true)
        );
    }

    public function getCounts(Request $request): JsonResponse
    {
        $me = $request->user();
        $requestsCount = Friendship::where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->count();

        return $this->success('SUCCESS', 'Counts retrieved', ['requests_count' => $requestsCount]);
    }

    public function sentRequests(Request $request): JsonResponse
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->paginate(30);

        return $this->success('SENT_REQUESTS_RETRIEVED', 'Sent requests retrieved',
            PublicUserResource::collection($users)->response()->getData(true)
        );
    }

    public function requests(Request $request): JsonResponse
    {
        $me = $request->user();
        $users = User::whereHas('sentFriendships', function ($q) use ($me)
        {
            $q->where('friend_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->paginate(30);

        return $this->success('INCOMING_REQUESTS_RETRIEVED', 'Incoming requests retrieved',
            PublicUserResource::collection($users)->response()->getData(true)
        );
    }

    public function blocked(Request $request): JsonResponse
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_BLOCKED);
        })->paginate(30);

        return $this->success('BLOCKED_USERS_RETRIEVED', 'Blocked users retrieved',
            PublicUserResource::collection($users)->response()->getData(true)
        );
    }
}