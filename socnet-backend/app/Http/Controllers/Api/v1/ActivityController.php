<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\CommentResource;
use App\Http\Resources\PostResource;
use App\Models\PollVote;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function __construct(protected ActivityService $activityService)
    {
    }

    /**
     * Повертає список постів де стоїть НАШ лайк
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function likedPosts(Request $request): JsonResponse
    {
        $posts = $this->activityService->getLikedPosts($request->user());

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
        $reposts = $this->activityService->getReposts($request->user());

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
        $user = auth()->user();

        $votedPollsCount = PollVote::where('user_id', $user->id)
            ->distinct('post_id')
            ->count('post_id');

        return response()->json([
            'success' => true,
            'data' => [
                'likes' => $user->likes()->count(),
                'comments' => $user->comments()->count(),
                'reposts' => $user->posts()->where('is_repost', true)->count(),
                'voted_polls' => $votedPollsCount,
            ]
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
        $comments = $this->activityService->getComments($request->user());

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
        $data = $this->activityService->getScreenTime($request->user());

        return $this->success('SCREEN_TIME_RETRIEVED', 'Screen time retrieved', $data);
    }

    /**
     * Повертає список постів де ми голосували в опитуванні
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function votedPolls(Request $request): JsonResponse
    {
        $posts = $this->activityService->getVotedPolls($request->user());

        return $this->success('VOTED_POLLS_RETRIEVED', 'Voted polls retrieved',
            PostResource::collection($posts)->response()->getData(true)
        );
    }
}