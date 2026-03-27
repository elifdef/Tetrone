<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contentMap = is_array($this->content) ? $this->content : [];
        $pollData = $contentMap['poll'] ?? [];

        $isAnonymous = $pollData['is_anonymous'] ?? false;
        $isQuiz = ($pollData['type'] ?? 'regular') === 'quiz';

        $pollResults = [];
        $voters = [];

        if ($this->relationLoaded('pollVotes'))
        {
            $groupedVotes = collect($this->pollVotes)->groupBy('option_id');

            foreach ($groupedVotes as $optionId => $votes)
            {
                $pollResults[$optionId] = $votes->count();

                if (!$isAnonymous)
                {
                    $voters[$optionId] = $votes->map(function ($vote)
                    {
                        return [
                            'id' => $vote->user->id ?? null,
                            'username' => $vote->user->username ?? null,
                            'avatar' => $vote->user->avatar_url ?? null,
                        ];
                    })->filter(fn($user) => $user['id'] !== null)->values()->toArray();
                }
            }
        }

        $votedOptionIds = $this->whenLoaded('myPollVotes')
            ? collect($this->myPollVotes)->pluck('option_id')->toArray()
            : [];

        $hasVoted = count($votedOptionIds) > 0;

        $options = array_map(function ($opt) use ($hasVoted, $isQuiz)
        {
            if ($isQuiz && !$hasVoted) unset($opt['is_correct']);
            return $opt;
        }, $pollData['options'] ?? []);

        $explanation = ($isQuiz && $hasVoted) ? ($pollData['explanation'] ?? null) : null;

        return [
            'question' => $pollData['question'] ?? null,
            'type' => $pollData['type'] ?? 'regular',
            'is_anonymous' => $isAnonymous,
            'can_change_vote' => $pollData['can_change_vote'] ?? false,
            'is_multiple_choice' => $pollData['is_multiple_choice'] ?? false,
            'is_closed' => $pollData['is_closed'] ?? false,
            'options' => $options,
            'explanation' => $explanation,

            'results' => (object)$pollResults,
            'voters' => (object)$voters,
            'voted_option_ids' => $votedOptionIds,
        ];
    }
}