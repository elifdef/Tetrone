<?php

namespace App\Services;

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

        if (!$poll)
        {
            return ['error' => 'ERR_NO_POLL', 'message' => 'This post does not contain a poll.', 'status' => 404];
        }

        if ($poll['is_closed'] ?? false)
        {
            return ['error' => 'ERR_POLL_CLOSED', 'message' => 'This poll is closed. Voting is no longer allowed.', 'status' => 403];
        }

        $isMultipleChoice = $poll['is_multiple_choice'] ?? false;
        $canChangeVote = $poll['can_change_vote'] ?? false;

        if (!$isMultipleChoice && count($selectedIds) > 1)
        {
            return ['error' => 'ERR_SINGLE_CHOICE_ONLY', 'message' => 'You can only select one option in this poll.', 'status' => 422];
        }

        $validOptionIds = array_column($poll['options'], 'id');
        if (array_diff($selectedIds, $validOptionIds))
        {
            return ['error' => 'ERR_INVALID_POLL_OPTION', 'message' => 'One or more selected options are invalid.', 'status' => 422];
        }

        $existingVotes = PollVote::where('post_id', $post->id)->where('user_id', $user->id)->pluck('option_id')->toArray();

        if (!empty($existingVotes))
        {
            if (!$canChangeVote)
            {
                return ['error' => 'ERR_VOTE_CHANGE_DENIED', 'message' => 'You have already voted. Changing your vote is not allowed in this poll.', 'status' => 403];
            }
            PollVote::where('post_id', $post->id)->where('user_id', $user->id)->delete();
        }

        $votesToInsert = array_map(function ($optionId) use ($post, $user)
        {
            return [
                'post_id' => $post->id,
                'user_id' => $user->id,
                'option_id' => $optionId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $selectedIds);

        PollVote::insert($votesToInsert);

        $results = PollVote::where('post_id', $post->id)
            ->selectRaw('option_id, count(*) as count')
            ->groupBy('option_id')
            ->pluck('count', 'option_id');

        $payload = [
            'results' => $results,
            'voted_option_ids' => $selectedIds
        ];

        $voters = [];
        if (!($poll['is_anonymous'] ?? false))
        {
            $allVotes = PollVote::where('post_id', $post->id)->with('user')->get()->groupBy('option_id');
            foreach ($allVotes as $optId => $votesGroup)
            {
                $voters[$optId] = $votesGroup->map(fn($v) => [
                    'id' => $v->user->id,
                    'username' => $v->user->username,
                    'avatar' => $v->user->avatar_url,
                ])->toArray();
            }
        }
        $payload['voters'] = empty($voters) ? new \stdClass() : $voters;

        if (($poll['type'] ?? 'regular') === 'quiz')
        {
            $payload['quiz_data'] = [
                'options' => $poll['options'],
                'explanation' => $poll['explanation'] ?? null
            ];
        }

        return ['success' => true, 'payload' => $payload];
    }

    public function getVoters(Post $post): array
    {
        $content = is_array($post->content) ? $post->content : [];
        $poll = $content['poll'] ?? null;

        if (!$poll)
        {
            return ['error' => 'ERR_NO_POLL', 'message' => 'Poll not found.', 'status' => 404];
        }

        if ($poll['is_anonymous'] ?? false)
        {
            return ['error' => 'ERR_POLL_ANONYMOUS', 'message' => 'This poll is anonymous.', 'status' => 403];
        }

        $groupedVotes = PollVote::where('post_id', $post->id)
            ->with('user')
            ->get()
            ->groupBy('option_id');

        $formattedVoters = [];

        foreach ($groupedVotes as $optionId => $votesGroup)
        {
            $users = $votesGroup->pluck('user')->filter();

            $formattedVoters[$optionId] = UserBasicResource::collection($users);
        }

        return ['success' => true, 'voters' => empty($formattedVoters) ? new stdClass() : $formattedVoters];
    }

    public function closePoll(Post $post, User $user): array|bool
    {
        if ($user->id !== $post->user_id)
        {
            return ['error' => 'ERR_CLOSE_PERMISSION_DENIED', 'message' => 'You do not have permission to close this poll.', 'status' => 403];
        }

        $content = is_array($post->content) ? $post->content : [];

        if (!isset($content['poll']))
        {
            return ['error' => 'ERR_NO_POLL', 'message' => 'This post does not contain a poll.', 'status' => 404];
        }

        if ($content['poll']['is_closed'] ?? false)
        {
            return ['error' => 'ERR_POLL_ALREADY_CLOSED', 'message' => 'This poll is already closed.', 'status' => 422];
        }

        $content['poll']['is_closed'] = true;
        $post->update(['content' => $content]);

        return true;
    }
}