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

        $posts = $this->postService->getWallPosts($targetUser, $currentUser);

        return PostResource::collection($posts);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $currentUser = $request->user('sanctum');

        if ($currentUser && $currentUser->isBlockedByTarget($currentUser->id, $post->user_id))
        {
            return $this->error('ERR_USER_BLOCKED', 'The user has restricted your access to the post.', 403);
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

        $mediaFiles = $request->file('media');
        if ($mediaFiles && !is_array($mediaFiles))
        {
            $mediaFiles = [$mediaFiles];
        }

        // Передаємо чистий $data. JSON вже розпаковано у Request!
        $post = $this->postService->createPost(
            $request->user(),
            $data,
            $mediaFiles
        );

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

        $mediaFiles = $request->file('media');
        if ($mediaFiles && !is_array($mediaFiles))
        {
            $mediaFiles = [$mediaFiles];
        }

        $deletedMediaIds = $request->input('deleted_media');
        if ($deletedMediaIds && !is_array($deletedMediaIds))
        {
            $deletedMediaIds = [$deletedMediaIds];
        }

        $result = $this->postService->updatePost(
            $post,
            $data,
            $mediaFiles,
            $deletedMediaIds
        );

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
            return $this->error('ERR_DELETE_PERMISSION_DENIED', "You do not have right to delete this post.", 403);
        }

        $this->postService->deletePost($post);

        return $this->success('POST_DELETED', 'Post deleted.', null, 202);
    }

    public function getUserAvatars(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $currentUser = $request->user('sanctum');

        $posts = $this->postService->getAvatarPosts($targetUser, $currentUser);

        return $this->success('SUCCESS', '', [
            'data' => PostResource::collection($posts)->resolve(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage()
            ]
        ]);
    }
}