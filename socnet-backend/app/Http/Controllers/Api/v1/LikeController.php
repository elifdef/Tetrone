<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Like;
use App\Models\Post;
use App\Notifications\NewLikeNotification;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function toggle(Request $request, Post $post)
    {
        $user = $request->user();

        // шукаєм чи вже є лайк
        $existingLike = Like::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        if ($existingLike)
        {
            $existingLike->delete();
            $liked = false;

            // якщо юзер забрав лайк видаляєм сповіщення з бази
            if ($post->user_id !== $user->id)
            {
                $post->user->notifications()
                    ->where('type', NewLikeNotification::class)
                    ->where('data->user_id', $user->id)
                    ->where('data->post_id', $post->id)
                    ->delete();
            }
        } else {
            Like::create([
                'user_id' => $user->id,
                'post_id' => $post->id
            ]);
            $liked = true;

            if ($post->user_id !== $user->id)
            {
                $alreadyNotified = $post->user->notifications()
                    ->where('type', NewLikeNotification::class)
                    ->where('data->user_id', $user->id)
                    ->where('data->post_id', $post->id)
                    ->exists();

                // якщо сповіщення ще немає
                if (!$alreadyNotified)
                    $post->user->notify(new NewLikeNotification($user, $post));
            }
        }

        return response()->json([
            'status' => true,
            'liked' => $liked,
            'likes_count' => $post->likes()->count()
        ]);
    }
}