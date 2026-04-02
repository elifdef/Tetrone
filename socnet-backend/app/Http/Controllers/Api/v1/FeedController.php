<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Post;
use App\Models\Friendship;
use Illuminate\Http\Request;
use App\Http\Resources\PostResource;
use Illuminate\Http\JsonResponse;

class FeedController extends Controller
{
    protected const POST_RELATIONS = [
        'user:id,username,first_name,last_name,avatar',
        'targetUser',
        'attachments',
        'pollVotes',
        'originalPost.user',
        'originalPost.attachments',
        'originalPost.originalPost.user',
        'originalPost.originalPost.attachments'
    ];

    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();
        $friendIds = $user->getAllFriendIds();
        $friendIds->push($user->id);

        $blockedIds = $this->getBlockedUserIds($user->id);

        $posts = Post::whereIn('user_id', $friendIds)
            ->whereNotIn('user_id', $blockedIds)
            ->where(function ($q) use ($blockedIds)
            {
                $q->whereNotIn('target_user_id', $blockedIds)
                    ->orWhereNull('target_user_id');
            })
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts'])
            ->withExists(['likes as is_liked' => function ($query) use ($user)
            {
                $query->where('user_id', $user->id);
            }])
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return $this->success('FEED_RETRIEVED', 'Feed retrieved',
            PostResource::collection($posts)->response()->getData(true)
        );
    }

    public function globalFeed(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        $query = Post::with(self::POST_RELATIONS)->latest();

        if ($user)
        {
            $blockedIds = $this->getBlockedUserIds($user->id);

            $query->whereNotIn('user_id', $blockedIds)
                ->where(function ($q) use ($blockedIds)
                {
                    $q->whereNotIn('target_user_id', $blockedIds)
                        ->orWhereNull('target_user_id');
                });

            $query->withExists(['likes as is_liked' => function ($q) use ($user)
            {
                $q->where('user_id', $user->id);
            }]);
        }

        $posts = $query->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return $this->success('GLOBAL_FEED_RETRIEVED', 'Global feed retrieved',
            PostResource::collection($posts)->response()->getData(true)
        );
    }

    /**
     * Отримати об'єднаний масив ID (кого я заблокував + хто заблокував мене)
     */
    private function getBlockedUserIds(int $userId)
    {
        $blockedBy = Friendship::where('friend_id', $userId)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->pluck('user_id');

        $blockedByMe = Friendship::where('user_id', $userId)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->pluck('friend_id');

        return $blockedBy->merge($blockedByMe);
    }
}