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

        $posts = Post::whereIn('user_id', $friendIds)
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
            $blockedBy = Friendship::where('friend_id', $user->id)
                ->where('status', Friendship::STATUS_BLOCKED)
                ->pluck('user_id');

            $blockedByMe = Friendship::where('user_id', $user->id)
                ->where('status', Friendship::STATUS_BLOCKED)
                ->pluck('friend_id');

            $query->whereNotIn('user_id', $blockedBy->merge($blockedByMe));

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
}