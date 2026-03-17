<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Appeal;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AppealController extends Controller
{
    public function checkStatus(Request $request): JsonResponse
    {
        $hasPending = Appeal::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->exists();

        return $this->success('SUCCESS', 'Appeal status checked', ['has_pending_appeal' => $hasPending]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // перевіряємо, чи юзер дійсно в бані
        if (!$user->is_banned)
        {
            return $this->error('ERR_NOT_BANNED', 'Your account is not banned.', 400);
        }

        // захист від спаму апеляціями
        $hasPending = Appeal::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending)
        {
            return $this->error('ERR_APPEAL_PENDING', 'You already have a pending appeal.', 429);
        }

        $request->validate(['message' => 'required|string|min:10|max:2000']);

        Appeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
            'status' => 'pending'
        ]);

        return $this->success('APPEAL_SUBMITTED', 'Appeal submitted successfully.');
    }
}