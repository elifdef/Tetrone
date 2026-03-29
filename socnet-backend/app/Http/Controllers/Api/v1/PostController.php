<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Post\StorePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use App\Http\Resources\PostResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class PostController extends Controller
{
    protected const POST_RELATIONS = [
        'user', 'targetUser', 'attachments', 'pollVotes', 'myPollVotes',
        'originalPost.user', 'originalPost.attachments',
        'originalPost.originalPost.user', 'originalPost.originalPost.attachments'
    ];

    public function __construct(protected PostService $postService)
    {
    }

    public function index(Request $request, string $username): JsonResponse|AnonymousResourceCollection
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $currentUser = $request->user('sanctum');

        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $targetUser->id))
        {
            return $this->error(
                'ERR_USER_BLOCKED',
                'The user has restricted your access.',
                403
            );
        }

        $query = Post::select('posts.*')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->where('users.is_banned', false)
            ->where(function ($q) use ($targetUser)
            {
                $q->where('posts.target_user_id', $targetUser->id)
                    ->orWhere(function ($q2) use ($targetUser)
                    {
                        $q2->where('posts.user_id', $targetUser->id)->whereNull('posts.target_user_id');
                    });
            })
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts']);

        if ($currentUser)
        {
            $query->withExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        }

        $posts = $query->latest('posts.created_at')->paginate(config('posts.max_paginate'));

        return PostResource::collection($posts);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $currentUser = $request->user('sanctum');

        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $post->user_id))
        {
            return $this->error(
                'ERR_USER_BLOCKED',
                'The user has restricted your access to the post.',
                403
            );
        }

        $post->load(self::POST_RELATIONS)->loadCount(['likes', 'comments', 'reposts']);

        if ($currentUser)
        {
            $post->loadExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        } else
        {
            $post->is_liked = false;
        }

        return $this->success('SUCCESS', 'Post retrieved successfully', (new PostResource($post))->resolve());
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['content'] = !empty($data['content']) ? json_decode($data['content'], true) : null;

        $post = $this->postService->createPost(
            $request->user(),
            $data,
            $request->file('media')
        );

        if (is_array($post) && isset($post['error']))
        {
            return $this->error($post['error'], $post['message'], $post['status'] ?? 400);
        }

        $post->load(self::POST_RELATIONS);

        return $this->success('POST_CREATED', 'Post created successfully', (new PostResource($post))->resolve(), 201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        if ($request->user()->id !== $post->user_id && $request->user()->cannot('edit-any-content'))
        {
            return $this->error('ERR_EDIT_PERMISSION_DENIED', "You do not have permission to edit someone else's post.", 403);
        }

        $data = $request->validated();

        $data['content'] = !empty($data['content']) ? json_decode($data['content'], true) : null;

        $result = $this->postService->updatePost(
            $post,
            $data,
            $request->file('media'),
            $request->input('deleted_media')
        );

        if (is_array($result) && isset($result['error']))
        {
            return $this->error($result['error'], $result['message'], $result['status'] ?? 400);
        }

        $result->load(self::POST_RELATIONS)
            ->loadCount(['likes', 'comments', 'reposts'])
            ->loadExists(['likes as is_liked' => fn($q) => $q->where('user_id', $request->user()->id)]);

        return $this->success('POST_UPDATED', 'Post updated successfully', (new PostResource($result))->resolve());
    }

    public function destroy(Post $post, Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $post->user_id && $post->target_user_id !== $user->id && $user->cannot('delete-any-content'))
        {
            return $this->error(
                'ERR_DELETE_PERMISSION_DENIED',
                "You do not have right to delete this post.",
                403
            );
        }

        $this->postService->deletePost($post);

        return $this->success(
            'POST_DELETED',
            'Post deleted.',
            null,
            202
        );
    }

    public function getUserAvatars(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $currentUser = $request->user('sanctum');

        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $targetUser->id))
        {
            return $this->error('ERR_USER_BLOCKED', '', 403);
        }

        $posts = Post::where('user_id', $targetUser->id)
            ->whereJsonContains('content', ['is_avatar_update' => true])
            ->with(self::POST_RELATIONS)
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->get();

        if ($currentUser)
        {
            $posts->loadExists(['likes as is_liked' => fn($q) => $q->where('user_id', $currentUser->id)]);
        }

        return $this->success('SUCCESS', '', PostResource::collection($posts));
    }
}