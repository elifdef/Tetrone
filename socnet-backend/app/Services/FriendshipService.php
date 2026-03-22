<?php

namespace App\Services;

use App\Events\UserBlockedEvent;
use App\Models\Friendship;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;

class FriendshipService
{
    public function sendRequest(User $me, User $targetUser): bool|array
    {
        if (!$me->hasVerifiedEmail())
        {
            return ['error' => 'ERR_EMAIL_UNVERIFIED', 'message' => 'Email not confirmed.', 'status' => 403];
        }

        if ($me->id === $targetUser->id)
        {
            return ['error' => 'ERR_CANNOT_FRIEND_SELF', 'message' => 'You cannot friend yourself XD', 'status' => 400];
        }

        $existing = Friendship::between($me, $targetUser)->first();

        if ($existing)
        {
            if ($existing->status == Friendship::STATUS_ACCEPTED)
            {
                return ['error' => 'ERR_ALREADY_FRIENDS', 'message' => 'Already friends', 'status' => 409];
            }
            if ($existing->status == Friendship::STATUS_PENDING)
            {
                return ['error' => 'ERR_REQUEST_PENDING', 'message' => 'Request already pending', 'status' => 409];
            }
            if ($existing->status == Friendship::STATUS_BLOCKED)
            {
                return ['error' => 'ERR_USER_BLOCKED', 'message' => 'Unable to send request', 'status' => 403];
            }
        }

        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_PENDING
        ]);

        $targetUser->notify(new NewFriendRequestNotification($me));

        return true;
    }

    public function acceptRequest(User $me, User $targetUser): bool
    {
        $friendship = Friendship::where('user_id', $targetUser->id)
            ->where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->first();

        if (!$friendship) return false;

        $friendship->update(['status' => Friendship::STATUS_ACCEPTED]);
        return true;
    }

    public function blockUser(User $me, User $targetUser): bool|array
    {
        if ($me->id === $targetUser->id)
        {
            return ['error' => 'ERR_CANNOT_BLOCK_SELF', 'message' => 'Cannot block yourself 1000-7', 'status' => 400];
        }

        Friendship::between($me, $targetUser)->delete();

        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_BLOCKED
        ]);

        broadcast(new UserBlockedEvent($me->id, $targetUser->id));

        return true;
    }

    public function unblockUser(User $me, User $targetUser): bool
    {
        return (bool)Friendship::where('user_id', $me->id)
            ->where('friend_id', $targetUser->id)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->delete();
    }
}