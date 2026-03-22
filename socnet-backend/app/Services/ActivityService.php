<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityService
{
    protected const POST_RELATIONS = [
        'user',
        'targetUser',
        'attachments',
        'originalPost.user',
        'originalPost.attachments',
        'originalPost.originalPost.user',
        'originalPost.originalPost.attachments'
    ];

    public function getLikedPosts(User $user): LengthAwarePaginator
    {
        return Post::select('posts.*')
            ->join('likes', 'posts.id', '=', 'likes.post_id')
            ->where('likes.user_id', $user->id)
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts'])
            ->withExists(['likes as is_liked' => function ($query) use ($user)
            {
                $query->where('user_id', $user->id);
            }])
            ->orderBy('likes.created_at', 'desc')
            ->paginate(config('posts.max_paginate'));
    }

    public function getReposts(User $user): LengthAwarePaginator
    {
        return $user->posts()
            ->whereNotNull('original_post_id')
            ->with(self::POST_RELATIONS)
            ->latest()
            ->paginate(config('posts.max_paginate'));
    }

    public function getCounts(User $user): array
    {
        return [
            'likes' => DB::table('likes')->where('user_id', $user->id)->count(),
            'comments' => $user->comments()->count(),
            'reposts' => $user->posts()->whereNotNull('original_post_id')->count()
        ];
    }

    public function getComments(User $user): LengthAwarePaginator
    {
        return $user->comments()
            ->with(['post', 'post.user'])
            ->latest()
            ->paginate(config('posts.max_paginate'));
    }

    public function getScreenTime(User $user): array
    {
        $user->load('activities');

        return [
            'total_active_seconds' => $user->activities->sum('active_seconds'),
            'history' => $user->activities->map(function ($act)
            {
                return [
                    'date' => $act->date,
                    'seconds' => $act->active_seconds,
                ];
            })->sortByDesc('date')->values()
        ];
    }
}