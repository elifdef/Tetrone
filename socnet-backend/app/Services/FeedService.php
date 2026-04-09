<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Models\Friendship;
use Illuminate\Pagination\LengthAwarePaginator;

class FeedService
{
    private const POST_RELATIONS = [
        'user:id,username,first_name,last_name,avatar',
        'targetUser', 'attachments', 'pollVotes',
        'originalPost.user', 'originalPost.attachments',
        'originalPost.originalPost.user', 'originalPost.originalPost.attachments'
    ];

    public function getPersonalFeed(User $user): LengthAwarePaginator
    {
        $friendIds = $user->getAllFriendIds();
        $friendIds->push($user->id);

        $blockedIds = $this->getBlockedUserIds($user->id);

        return Post::whereIn('user_id', $friendIds)
            ->whereNotIn('user_id', $blockedIds)
            ->where(function ($q) use ($blockedIds)
            {
                $q->whereNotIn('target_user_id', $blockedIds)->orWhereNull('target_user_id');
            })
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts'])
            ->withExists(['likes as is_liked' => fn($q) => $q->where('user_id', $user->id)])
            ->latest()
            ->paginate(config('posts.max_paginate', 15));
    }

    public function getGlobalFeed(?User $user): LengthAwarePaginator
    {
        $query = Post::with(self::POST_RELATIONS);

        if ($user)
        {
            $blockedIds = $this->getBlockedUserIds($user->id);
            $query->whereNotIn('user_id', $blockedIds)
                ->where(function ($q) use ($blockedIds)
                {
                    $q->whereNotIn('target_user_id', $blockedIds)->orWhereNull('target_user_id');
                })
                ->withExists(['likes as is_liked' => fn($q) => $q->where('user_id', $user->id)]);
        }

        return $query->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(config('posts.max_paginate', 15));
    }

    private function getBlockedUserIds(int $userId)
    {
        $blockedBy = Friendship::where('friend_id', $userId)->where('status', Friendship::STATUS_BLOCKED)->pluck('user_id');
        $blockedByMe = Friendship::where('user_id', $userId)->where('status', Friendship::STATUS_BLOCKED)->pluck('friend_id');

        return $blockedBy->merge($blockedByMe);
    }
}