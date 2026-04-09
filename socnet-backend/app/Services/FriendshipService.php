<?php

namespace App\Services;

use App\Events\UserBlockedEvent;
use App\Exceptions\ApiException;
use App\Models\Friendship;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;

class FriendshipService
{
    public function sendRequest(User $me, User $targetUser): void
    {
        if (!$me->hasVerifiedEmail())
        {
            throw new ApiException('ERR_EMAIL_UNVERIFIED', 403);
        }

        if ($me->id === $targetUser->id)
        {
            throw new ApiException('ERR_CANNOT_FRIEND_SELF', 400);
        }

        $existing = Friendship::between($me, $targetUser)->first();

        if ($existing)
        {
            if ($existing->status == Friendship::STATUS_ACCEPTED)
            {
                throw new ApiException('ERR_ALREADY_FRIENDS', 409);
            }
            if ($existing->status == Friendship::STATUS_PENDING)
            {
                throw new ApiException('ERR_REQUEST_PENDING', 409);
            }
            if ($existing->status == Friendship::STATUS_BLOCKED)
            {
                throw new ApiException('ERR_USER_BLOCKED', 403);
            }
        }

        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_PENDING
        ]);

        $targetUser->notify(new NewFriendRequestNotification($me));
    }

    public function acceptRequest(User $me, User $targetUser): void
    {
        $friendship = Friendship::where('user_id', $targetUser->id)
            ->where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->first();

        if (!$friendship)
        {
            throw new ApiException('ERR_NO_PENDING_REQUEST', 404);
        }

        $friendship->update(['status' => Friendship::STATUS_ACCEPTED]);
    }

    public function destroyFriendship(User $me, User $targetUser): void
    {
        Friendship::between($me, $targetUser)->delete();
    }

    public function blockUser(User $me, User $targetUser): void
    {
        if ($me->id === $targetUser->id)
        {
            throw new ApiException('ERR_CANNOT_BLOCK_SELF', 400);
        }

        Friendship::between($me, $targetUser)->delete();

        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_BLOCKED
        ]);

        broadcast(new UserBlockedEvent($me->id, $targetUser->id));
    }

    public function unblockUser(User $me, User $targetUser): void
    {
        $deleted = Friendship::where('user_id', $me->id)
            ->where('friend_id', $targetUser->id)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->delete();

        if (!$deleted)
        {
            throw new ApiException('ERR_NOT_IN_BLACKLIST', 404);
        }
    }
}