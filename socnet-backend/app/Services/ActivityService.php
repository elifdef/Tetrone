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
        'originalPost.originalPost.attachments',
        'pollVotes'
    ];

    /**
     * Спільний метод для підготовки запиту постів
     */
    private function preparePostQuery(User $user)
    {
        return Post::with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts'])
            ->withExists(['likes as is_liked' => function ($query) use ($user)
            {
                $query->where('user_id', $user->id);
            }]);
    }

    public function getLikedPosts(User $user): LengthAwarePaginator
    {
        return $this->preparePostQuery($user)
            ->join('likes', 'posts.id', '=', 'likes.post_id')
            ->where('likes.user_id', $user->id)
            ->addSelect('posts.*')
            ->orderBy('likes.created_at', 'desc')
            ->paginate(config('posts.max_paginate'));
    }

    public function getReposts(User $user): LengthAwarePaginator
    {
        return $this->preparePostQuery($user)
            ->where('user_id', $user->id)
            ->whereNotNull('original_post_id')
            ->latest()
            ->paginate(config('posts.max_paginate'));
    }

    public function getCounts(User $user): array
    {
        return [
            'likes' => DB::table('likes')->where('user_id', $user->id)->count(),
            'comments' => DB::table('comments')->where('user_id', $user->id)->count(),
            'reposts' => DB::table('posts')->where('user_id', $user->id)->whereNotNull('original_post_id')->count(),
            'voted_polls' => DB::table('poll_votes')->where('user_id', $user->id)->count()
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
        $totalSeconds = (int)DB::table('user_activities')
            ->where('user_id', $user->id)
            ->sum('active_seconds');

        $history = DB::table('user_activities')
            ->where('user_id', $user->id)
            ->orderByDesc('date')
            ->get(['date', 'active_seconds as seconds']);

        return [
            'total_active_seconds' => $totalSeconds,
            'history' => $history
        ];
    }

    public function getVotedPolls(User $user): LengthAwarePaginator
    {
        return $this->preparePostQuery($user)
            ->whereHas('pollVotes', function ($query) use ($user)
            {
                $query->where('user_id', $user->id);
            })
            ->latest()
            ->paginate(config('posts.max_paginate'));
    }
}