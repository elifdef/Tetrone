<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Comment;
use App\Models\Post;
use App\Services\CommentService;
use Illuminate\Http\Request;
use App\Http\Resources\CommentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Requests\Comment\UpdateCommentRequest;

class CommentController extends Controller
{
    public function __construct(protected CommentService $commentService)
    {
    }

    public function index(Post $post): AnonymousResourceCollection
    {
        $comments = $this->commentService->getPostComments($post);

        return CommentResource::collection($comments)->additional([
            'success' => true,
            'code' => 'COMMENTS_RETRIEVED'
        ]);
    }

    public function store(StoreCommentRequest $request, Post $post): CommentResource
    {
        $this->authorize('comment', $post);

        $comment = $this->commentService->createComment(
            $post,
            $request->user(),
            $request->validated('content')
        );

        return new CommentResource($comment->load('user'))->additional([
            'success' => true,
            'code' => 'COMMENT_CREATED'
        ]);
    }

    public function update(UpdateCommentRequest $request, Comment $comment): CommentResource
    {
        // Перевіряємо чи є права на редагування (через CommentPolicy)
        $this->authorize('update', $comment);

        $updatedComment = $this->commentService->updateComment(
            $comment,
            $request->validated('content')
        );

        return new CommentResource($updatedComment->load('user'))->additional([
            'success' => true,
            'code' => 'COMMENT_UPDATED'
        ]);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        // Перевіряємо чи є права на видалення (через CommentPolicy)
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json([
            'success' => true,
            'code' => 'COMMENT_DELETED'
        ], 200);
    }

    public function myComments(Request $request): AnonymousResourceCollection
    {
        $comments = $this->commentService->getMyComments($request->user());

        return CommentResource::collection($comments)->additional([
            'success' => true,
            'code' => 'MY_COMMENTS_RETRIEVED'
        ]);
    }
}