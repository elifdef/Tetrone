<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Like;
use App\Models\Post;
use App\Notifications\NewLikeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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

            // якщо юзер забрав лайк видаляєм сповіщення з бази (щоб воно зникло з меню)
            if ($post->user_id !== $user->id)
            {
                $post->user->notifications()
                    ->where('type', NewLikeNotification::class)
                    ->where('data->user_id', $user->id)
                    ->where('data->post_id', $post->id)
                    ->delete();
            }
        } else
        {
            Like::create([
                'user_id' => $user->id,
                'post_id' => $post->id
            ]);
            $liked = true;

            if ($post->user_id !== $user->id)
            {
                // захист від спаму поставив лайк - забрав лайк
                $spamCacheKey = "like_spam_user_{$user->id}_post_{$post->id}";

                if (!Cache::has($spamCacheKey))
                {
                    $prefs = $post->user->getNotificationPreferencesFor($user->id, 'likes');

                    if ($prefs['should_notify'])
                    {
                        $post->user->notify(new NewLikeNotification($user, $post, $prefs['sound']));
                    }

                    Cache::put($spamCacheKey, true, now()->addDay());
                }
            }
        }

        return response()->json([
            'status' => true,
            'liked' => $liked,
            'likes_count' => $post->likes()->count()
        ]);
    }
}