<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\PollService;
use App\Http\Requests\Poll\VotePollRequest;

class PollController extends Controller
{
    public function __construct(protected PollService $pollService)
    {
    }

    public function vote(VotePollRequest $request, Post $post): JsonResponse
    {
        $result = $this->pollService->vote(
            $post,
            $request->user(),
            $request->validated('option_ids')
        );

        if (isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('VOTE_RECORDED', 'Vote successfully recorded.', $result['payload']);
    }

    public function voters(Post $post): JsonResponse
    {
        $result = $this->pollService->getVoters($post);

        if (isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('SUCCESS', 'Voters retrieved', ['voters' => $result['voters']]);
    }

    public function close(Request $request, Post $post): JsonResponse
    {
        $result = $this->pollService->closePoll($post, $request->user());

        if (is_array($result) && isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status']);
        }

        return $this->success('POLL_CLOSED', 'Poll closed.');
    }
}