<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Friendship;
use App\Services\FileStorageService;
use App\Http\Resources\PostResource;

class PostController extends Controller
{
    protected $fileService;

    public function __construct(FileStorageService $fileService)
    {
        $this->fileService = $fileService;
    }

    // Отримати пости конкретного юзера
    public function index(Request $request, string $username)
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $currentUser = $request->user('sanctum');

        if ($currentUser && $this->isBlockedByTarget($currentUser->id, $targetUser->id))
            return response()->json([
                'message' => 'Access denied.',
                'data' => []
            ], 403);

        $posts = $targetUser->posts()
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return PostResource::collection($posts);
    }

    // показати один пост по його id
    public function show(Request $request, Post $post)
    {
        $currentUser = $request->user();

        if ($currentUser && $this->isBlockedByTarget($currentUser->id, $post->user_id))
            return response()->json(['message' => 'Forbidden'], 403);

        $post->load('user');
        $post->loadCount(['likes', 'comments']);

        return new PostResource($post);
    }

    // Створити пост
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string|max:2048',
            'image' => 'nullable|image|max:' . config('uploads.max_size')
        ]);

        if (!$request->input('content') && !$request->hasFile('image'))
            return response()->json(['message' => 'Post cannot be empty'], 422);

        $path = null;
        if ($request->hasFile('image'))
        {
            $path = $this->fileService->upload(
                file: $request->file('image'),
                folder: $request->user()->username,
                prefix: 'post'
            );
        }

        $post = $request->user()->posts()->create([
            'content' => $request->input('content'),
            'image' => $path
        ]);
        return response()->json($post->load('user:id,username,first_name,last_name,avatar'));
    }

    // Видалити пост
    public function destroy(Post $post, Request $request)
    {
        // видаляти може тільки власник
        if ($request->user()->id !== $post->user_id)
            return response()->json(['message' => 'Forbidden'], 403);

        if ($post->image)
            Storage::disk('public')->delete($post->image);

        $post->delete();
        return response()->json(['message' => 'Post deleted']);
    }

    // Оновлення поста
    public function update(Request $request, Post $post)
    {
        // редагувати може тільки власник
        if ($request->user()->id !== $post->user_id)
            return response()->json(['message' => 'Forbidden'], 403);

        $request->validate([
            'content' => 'nullable|string|max:2048',
            'image' => 'nullable|image|max:' . config('uploads.max_size')
        ]);

        $data = [];

        // оновлення тексту
        if ($request->has('content'))
            $data['content'] = $request->input('content');

        if ($request->boolean('delete_image') && !$request->hasFile('image'))
        {
            if ($post->image)
                Storage::disk('public')->delete($post->image);
            $data['image'] = null;
        }

        if ($request->hasFile('image'))
        {
            if ($post->image)
                Storage::disk('public')->delete($post->image);

            $path = $this->fileService->upload(
                file: $request->file('image'),
                folder: $request->user()->username,
                prefix: 'post'
            );

            $data['image'] = $path;
        }

        $post->update($data);
        return response()->json($post->load('user:id,username,first_name,last_name,avatar'));
    }

    // перевірка для того щоб А не міг бачити пости Б якщо Б заблокував А
    // але гості можуть бачити)00)) тому це обходиться приватною вкладкою
    private function isBlockedByTarget(int $viewerId, int $targetId): bool
    {
        if ($viewerId === $targetId) return false;
        return Friendship::where('user_id', $targetId)
            ->where('friend_id', $viewerId)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->exists();
    }

    // стрічка новин з постами НАШИХ друзів
    public function feed(Request $request)
    {
        $user = $request->user();
        $friendIds = $user->getAllFriendIds();
        $friendIds->push($user->id); // щоб бачити і свої пости

        $posts = Post::whereIn('user_id', $friendIds)
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate(config('posts.max_paginate'));

        return PostResource::collection($posts);
    }

    // глобальна стрічка з ВСІМА постами
    public function globalFeed(Request $request)
    {
        $user = $request->user('sanctum');

        $query = Post::with('user:id,username,first_name,last_name,avatar')->latest();

        if ($user)
        {
            // отримуємо ID тих хто заблокував МЕНЕ
            $blockedBy = Friendship::where('friend_id', $user->id)
                ->where('status', Friendship::STATUS_BLOCKED)
                ->pluck('user_id');

            // отримуємо ID тих кого заблокував Я
            $blockedByMe = Friendship::where('user_id', $user->id)
                ->where('status', Friendship::STATUS_BLOCKED)
                ->pluck('friend_id');

            $query->whereNotIn('user_id', $blockedBy->merge($blockedByMe));
        }

        $posts = $query
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate(config('posts.max_paginate'));
        return PostResource::collection($posts);
    }
}