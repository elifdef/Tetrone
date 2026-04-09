<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Http\Resources\UserBasicResource;
use App\Models\Post;
use App\Models\User;
use App\Models\PollVote;
use stdClass;

class PollService
{
    public function vote(Post $post, User $user, array $selectedIds): array
    {
        $content = is_array($post->content) ? $post->content : [];
        $poll = $content['poll'] ?? null;

        if (!$poll) throw new ApiException('ERR_NO_POLL', 404);
        if ($poll['is_closed'] ?? false) throw new ApiException('ERR_POLL_CLOSED', 403);

        $isMultipleChoice = $poll['is_multiple_choice'] ?? false;
        $canChangeVote = $poll['can_change_vote'] ?? false;

        if (!$isMultipleChoice && count($selectedIds) > 1)
        {
            throw new ApiException('ERR_SINGLE_CHOICE_ONLY', 422);
        }

        $validOptionIds = array_column($poll['options'], 'id');
        if (array_diff($selectedIds, $validOptionIds))
        {
            throw new ApiException('ERR_INVALID_POLL_OPTION', 422);
        }

        $existingVotes = PollVote::where('post_id', $post->id)->where('user_id', $user->id)->pluck('option_id')->toArray();

        if (!empty($existingVotes))
        {
            if (!$canChangeVote) throw new ApiException('ERR_VOTE_CHANGE_DENIED', 403);
            PollVote::where('post_id', $post->id)->where('user_id', $user->id)->delete();
        }

        $votesToInsert = array_map(fn($optId) => [
            'post_id' => $post->id, 'user_id' => $user->id, 'option_id' => $optId, 'created_at' => now(), 'updated_at' => now(),
        ], $selectedIds);

        PollVote::insert($votesToInsert);

        $results = PollVote::where('post_id', $post->id)->selectRaw('option_id, count(*) as count')->groupBy('option_id')->pluck('count', 'option_id');

        $payload = ['results' => $results, 'voted_option_ids' => $selectedIds];

        $voters = [];
        if (!($poll['is_anonymous'] ?? false))
        {
            $allVotes = PollVote::where('post_id', $post->id)->with('user')->get()->groupBy('option_id');
            foreach ($allVotes as $optId => $votesGroup)
            {
                $voters[$optId] = $votesGroup->map(fn($v) => [
                    'id' => $v->user->id, 'username' => $v->user->username, 'avatar' => $v->user->avatar_url,
                ])->toArray();
            }
        }
        $payload['voters'] = empty($voters) ? new stdClass() : $voters;

        if (($poll['type'] ?? 'regular') === 'quiz')
        {
            $payload['quiz_data'] = ['options' => $poll['options'], 'explanation' => $poll['explanation'] ?? null];
        }

        return $payload;
    }

    public function getVoters(Post $post): array|stdClass
    {
        $content = is_array($post->content) ? $post->content : [];
        $poll = $content['poll'] ?? null;

        if (!$poll) throw new ApiException('ERR_NO_POLL', 404);
        if ($poll['is_anonymous'] ?? false) throw new ApiException('ERR_POLL_ANONYMOUS', 403);

        $groupedVotes = PollVote::where('post_id', $post->id)->with('user')->get()->groupBy('option_id');
        $formattedVoters = [];

        foreach ($groupedVotes as $optionId => $votesGroup)
        {
            $formattedVoters[$optionId] = UserBasicResource::collection($votesGroup->pluck('user')->filter());
        }

        return empty($formattedVoters) ? new stdClass() : $formattedVoters;
    }

    public function closePoll(Post $post): void
    {
        $content = is_array($post->content) ? $post->content : [];

        if (!isset($content['poll'])) throw new ApiException('ERR_NO_POLL', 404);
        if ($content['poll']['is_closed'] ?? false) throw new ApiException('ERR_POLL_ALREADY_CLOSED', 422);

        $content['poll']['is_closed'] = true;
        $post->update(['content' => $content]);
    }
}