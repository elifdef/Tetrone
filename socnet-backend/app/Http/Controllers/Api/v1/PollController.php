<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use App\Services\PollService;
use App\Http\Requests\Poll\VotePollRequest;

class PollController extends Controller
{
    public function __construct(protected PollService $pollService)
    {
    }

    /**
     * Проголосувати в опитуванні
     *
     * @group Polls
     * @authenticated
     * @response 200 storage/responses/poll_voted.json
     */
    public function vote(VotePollRequest $request, Post $post): JsonResponse
    {
        $this->authorize('vote', $post);

        $payload = $this->pollService->vote(
            $post,
            $request->user(),
            $request->validated('option_ids')
        );

        return response()->json([
            'success' => true,
            'code' => 'VOTE_RECORDED',
            'data' => $payload
        ]);
    }

    /**
     * Отримати список тих, хто проголосував
     *
     * @group Polls
     * @authenticated
     * @response 200 storage/responses/poll_voters.json
     */
    public function voters(Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $voters = $this->pollService->getVoters($post);

        return response()->json([
            'success' => true,
            'code' => 'SUCCESS',
            'data' => ['voters' => $voters]
        ]);
    }

    /**
     * Закрити опитування
     *
     * @group Polls
     * @authenticated
     * @response 200
     */
    public function close(Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $this->pollService->closePoll($post);

        return response()->json([
            'success' => true,
            'code' => 'POLL_CLOSED'
        ]);
    }
}