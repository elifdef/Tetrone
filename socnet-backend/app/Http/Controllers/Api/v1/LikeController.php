<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Post;
use App\Services\LikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function __construct(protected LikeService $likeService)
    {
    }

    public function toggle(Request $request, Post $post): JsonResponse
    {
        $this->authorize('like', $post);

        $result = $this->likeService->toggleLike($request->user(), $post);

        return response()->json([
            'success' => true,
            'code' => 'LIKE_TOGGLED',
            'data' => $result
        ], 200);
    }
}