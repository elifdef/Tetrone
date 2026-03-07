<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Appeal;
use Illuminate\Http\Request;

class AppealController extends Controller
{
    // перевірка чи є вже активна апеляція
    public function checkStatus(Request $request)
    {
        $hasPending = Appeal::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'has_pending_appeal' => $hasPending
        ]);
    }

    // подача апеляції
    public function store(Request $request)
    {
        $user = $request->user();

        // перевіряємо, чи юзер дійсно в бані
        if (!$user->is_banned)
        {
            return response()->json(['message' => 'Your account is not banned.'], 400);
        }

        // захист від спаму апеляціями
        $hasPending = Appeal::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending)
        {
            return response()->json(['message' => 'You already have a pending appeal.'], 429);
        }

        $request->validate([
            'message' => 'required|string|min:10|max:2000'
        ]);

        Appeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
            'status' => 'pending'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Appeal submitted successfully.'
        ]);
    }
}