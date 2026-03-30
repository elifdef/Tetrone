<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Comment;
use App\Models\Post;
use App\Services\CommentService;
use Illuminate\Http\Request;
use App\Http\Resources\CommentResource;
use Illuminate\Http\JsonResponse;

class CommentController extends Controller
{
    public function __construct(protected CommentService $commentService)
    {
    }

    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with('user')
            ->whereHas('user', function ($query)
            {
                $query->where('is_banned', false);
            })
            ->latest()
            ->paginate(config('comments.max_paginate', 30));

        return $this->success('COMMENTS_RETRIEVED', 'Comments retrieved',
            CommentResource::collection($comments)->response()->getData(true)
        );
    }

    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('comment', $post);

        $request->validate([
            'content' => 'required|array'
        ]);

        $comment = $this->commentService->createComment(
            $post,
            $request->user(),
            $request->input('content')
        );

        return $this->success('COMMENT_CREATED', 'Comment created', (new CommentResource($comment->load('user')))->resolve(), 201);
    }

    public function update(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $request->validate([
            'content' => 'required|array'
        ]);

        $updatedComment = $this->commentService->updateComment(
            $comment,
            $request->input('content')
        );

        return $this->success('COMMENT_UPDATED', 'Comment updated', (new CommentResource($updatedComment->load('user')))->resolve());
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return $this->success('COMMENT_DELETED', 'Deleted');
    }

    public function myComments(Request $request): JsonResponse
    {
        $comments = $request->user()->comments()
            ->with(['post.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(config('comments.max_paginate', 30));

        return $this->success('MY_COMMENTS_RETRIEVED', 'My comments',
            CommentResource::collection($comments)->response()->getData(true)
        );
    }
}