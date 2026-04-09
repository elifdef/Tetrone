<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\User;
use App\Models\Post;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function getLandingStats(): JsonResponse
    {
        $fiveMinutesAgo = Carbon::now()->subMinutes(5);

        $data = [
            'users' => User::count(),
            'posts' => Post::count(),
            'online' => User::where('last_seen_at', '>=', $fiveMinutesAgo)->count(),
        ];

        return response()->json(['code' => 'STATS_RETRIEVED', 'data' => $data]);
    }
}