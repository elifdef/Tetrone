<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\CommentResource;
use App\Http\Resources\PostResource;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ActivityController extends Controller
{
    public function __construct(protected ActivityService $activityService)
    {
    }

    /**
     * Отримати вподобані пости
     *
     * Повертає список постів з пагінацією, які вподобав поточний користувач.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_liked_posts.json
     */
    public function likedPosts(Request $request): AnonymousResourceCollection
    {
        $posts = $this->activityService->getLikedPosts($request->user());

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'LIKED_POSTS_RETRIEVED'
        ]);
    }

    /**
     * Отримати репости користувача
     *
     * Повертає список репостів, які зробив поточний користувач.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_reposts.json
     */
    public function reposts(Request $request): AnonymousResourceCollection
    {
        $reposts = $this->activityService->getReposts($request->user());

        return PostResource::collection($reposts)->additional([
            'success' => true,
            'code' => 'REPOSTS_RETRIEVED'
        ]);
    }

    /**
     * Отримати лічильники активності
     *
     * Повертає загальну кількість лайків, коментарів, репостів та голосувань користувача для відображення у вкладці активності.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_counts.json
     */
    public function getCounts(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => 'ACTIVITY_COUNTS_RETRIEVED',
            'data' => $this->activityService->getCounts($request->user())
        ], 200);
    }

    /**
     * Отримати коментарі користувача
     *
     * Повертає пагінований список коментарів, які залишив поточний користувач.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_comments.json
     */
    public function comments(Request $request): AnonymousResourceCollection
    {
        $comments = $this->activityService->getComments($request->user());

        return CommentResource::collection($comments)->additional([
            'success' => true,
            'code' => 'COMMENTS_RETRIEVED'
        ]);
    }

    /**
     * Отримати екранний час (Screen Time)
     *
     * Повертає загальну статистику часу, проведеного користувачем на сайті, та історію по днях.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_screen_time.json
     */
    public function screenTime(Request $request): JsonResponse
    {
        $data = $this->activityService->getScreenTime($request->user());

        return response()->json([
            'success' => true,
            'code' => 'SCREEN_TIME_RETRIEVED',
            'data' => $data
        ], 200);
    }

    /**
     * Отримати опитування, в яких голосував користувач
     *
     * Повертає список постів з опитуваннями, де користувач віддав свій голос.
     *
     * @group Activity
     * @authenticated
     * @response 200 storage/responses/activity_voted_polls.json
     */
    public function votedPolls(Request $request): AnonymousResourceCollection
    {
        $posts = $this->activityService->getVotedPolls($request->user());

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'VOTED_POLLS_RETRIEVED'
        ]);
    }
}