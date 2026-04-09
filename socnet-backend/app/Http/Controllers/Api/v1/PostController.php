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
    public function __construct(protected PostService $postService)
    {
    }

    /**
     * Отримати стіну користувача
     *
     * @group Posts
     * @urlParam user string required Нікнейм користувача. Example: andrew
     * @response 200 storage/responses/posts_list.json
     */
    public function index(Request $request, User $user): AnonymousResourceCollection
    {
        $posts = $this->postService->getWallPosts($user, $request->user('sanctum'));

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'SUCCESS'
        ]);
    }

    /**
     * Отримати один пост
     *
     * @group Posts
     * @urlParam post integer required ID поста. Example: 1
     * @response 200 storage/responses/post_single.json
     */
    public function show(Request $request, Post $post): PostResource
    {
        $this->authorize('view', $post);

        $post = $this->postService->loadPostRelations($post, $request->user('sanctum'));

        return new PostResource($post)->additional([
            'success' => true,
            'code' => 'SUCCESS'
        ]);
    }

    /**
     * Створити пост
     *
     * @group Posts
     * @authenticated
     * @response 201 storage/responses/post_created.json
     */
    public function store(StorePostRequest $request): PostResource
    {
        $post = $this->postService->createPost(
            $request->user(),
            $request->validated(),
            $request->file('media')
        );

        $post = $this->postService->loadPostRelations($post, $request->user());

        return new PostResource($post)->additional([
            'success' => true,
            'code' => 'POST_CREATED'
        ]);
    }

    /**
     * Оновити пост
     *
     * @group Posts
     * @authenticated
     * @urlParam post integer required ID поста. Example: 1
     * @response 200 storage/responses/post_updated.json
     */
    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $this->authorize('update', $post);

        $updatedPost = $this->postService->updatePost(
            $post,
            $request->validated(),
            $request->file('media'),
            $request->input('deleted_media')
        );

        $updatedPost = $this->postService->loadPostRelations($updatedPost, $request->user());

        return new PostResource($updatedPost)->additional([
            'success' => true,
            'code' => 'POST_UPDATED'
        ]);
    }

    /**
     * Видалити пост
     *
     * @group Posts
     * @authenticated
     * @urlParam post integer required ID поста. Example: 1
     * @response 202
     */
    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $this->postService->deletePost($post);

        // Для дій без ресурсу віддаємо просто JSON
        return response()->json([
            'success' => true,
            'code' => 'POST_DELETED'
        ], 202);
    }

    /**
     * Отримати історію аватарок
     *
     * @group Posts
     * @urlParam user string required Нікнейм користувача. Example: andrew
     * @response 200 storage/responses/avatars_list.json
     */
    public function getUserAvatars(Request $request, User $user): AnonymousResourceCollection
    {
        $posts = $this->postService->getAvatarPosts($user, $request->user('sanctum'));

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'SUCCESS'
        ]);
    }
}