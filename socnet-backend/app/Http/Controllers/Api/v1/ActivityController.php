<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\CommentResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\PostResource;

class ActivityController extends Controller
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

    /**
     * Повертає список постів де стоїть НАШ лайк
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function likedPosts(Request $request): JsonResponse
    {
        $user = $request->user();

        $posts = Post::select('posts.*')
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

        return $this->success('LIKED_POSTS_RETRIEVED', 'Liked posts retrieved',
            PostResource::collection($posts)->response()->getData(true)
        );
    }

    /**
     * Повертає список репостів користувача
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function reposts(Request $request): JsonResponse
    {
        $user = $request->user();

        $reposts = $user->posts()
            ->whereNotNull('original_post_id')
            ->with(self::POST_RELATIONS)
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return $this->success('REPOSTS_RETRIEVED', 'Reposts retrieved',
            PostResource::collection($reposts)->response()->getData(true)
        );
    }

    /**
     * Повертає лічильники для вкладки активності
     *
     * * @param Request $request
     * @return JsonResponse
     */
    public function getCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        $likesCount = DB::table('likes')->where('user_id', $user->id)->count();
        $commentsCount = $user->comments()->count();
        $repostsCount = $user->posts()->whereNotNull('original_post_id')->count();

        return $this->success('ACTIVITY_COUNTS_RETRIEVED', 'Counts retrieved', [
            'likes' => $likesCount,
            'comments' => $commentsCount,
            'reposts' => $repostsCount
        ]);
    }

    /**
     * Повертає пагінований список коментарів які залишив поточний користувач.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function comments(Request $request): JsonResponse
    {
        $user = $request->user();

        $comments = $user->comments()
            ->with(['post', 'post.user'])
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return $this->success('COMMENTS_RETRIEVED', 'Comments retrieved',
            CommentResource::collection($comments)->response()->getData(true)
        );
    }

    /**
     * Повертає скільки користувач насидів на сайті
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function screenTime(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('activities');

        return $this->success('SCREEN_TIME_RETRIEVED', 'Screen time retrieved', [
            'total_active_seconds' => $user->activities->sum('active_seconds'),
            'history' => $user->activities->map(function ($act)
            {
                return [
                    'date' => $act->date,
                    'seconds' => $act->active_seconds,
                ];
            })->sortByDesc('date')->values()
        ]);
    }
}