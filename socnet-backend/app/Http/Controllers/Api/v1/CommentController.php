<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // отримати ВСІ коментарі до поста
    public function index(Post $post)
    {
        $comments = $post->comments()
            ->with('user:id,username,first_name,last_name,avatar')
            ->latest() // нові зверху
            ->paginate(20);

        return response()->json($comments);
    }

    // створити коментар
    public function store(Request $request, Post $post)
    {
        $request->validate(['content' => 'required|string|max:1000']);

        $comment = $post->comments()->create([
            'content' => $request->input('content'),
            'user_id' => $request->user()->id
        ]);

        return response()->json(
            $comment->load('user:id,username,first_name,last_name,avatar'), 201);
    }

    // видалити коментар
    public function destroy(Request $request, Comment $comment)
    {
        // Видаляти може ТІЛЬКИ автор коментаря
        if ($request->user()->id !== $comment->user_id)
            return response()->json(['message' => 'Forbidden'], 403);

        $comment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}