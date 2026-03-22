<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Models\Post;
use App\Models\User;
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $relations = [
            'user', 'targetUser', 'attachments',
            'originalPost.user', 'originalPost.attachments',
            'originalPost.originalPost.user', 'originalPost.originalPost.attachments'
        ];

        $query = Post::with($relations)->withCount(['likes', 'comments', 'reposts'])->latest();

        if ($request->has('username') && !empty($request->username))
        {
            $query->whereHas('user', function ($q) use ($request)
            {
                $q->where('username', $request->username);
            });
        }

        $posts = $query->paginate(config('posts.max_paginate', 20));

        return $this->success('POSTS_RETRIEVED', 'Posts loaded',
            PostResource::collection($posts)->response()->getData(true)
        );
    }
}