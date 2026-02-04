<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function toggle(Request $request, Post $post)
    {
        $userId = $request->user()->id;

        // шукаєм чи вже є лайк
        $existingLike = Like::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existingLike)
        {
            $existingLike->delete();
            $liked = false;
        } else
        {
            Like::create([
                'user_id' => $userId,
                'post_id' => $post->id
            ]);
            $liked = true;
        }

        return response()->json([
            'status' => true,
            'liked' => $liked,
            'likes_count' => $post->likes()->count() // Повертаємо нову кількість
        ]);
    }
}