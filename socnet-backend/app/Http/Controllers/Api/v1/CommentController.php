<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Comment;
use App\Models\Post;
use App\Notifications\NewCommentNotification;
use Illuminate\Http\Request;
use App\Http\Resources\CommentResource;
use Illuminate\Http\JsonResponse;

class CommentController extends Controller
{
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with('user')
            ->whereHas('user', function ($query)
            {
                $query->where('is_banned', false);
            })
            ->latest()
            ->paginate(config('comments.max_paginate'));

        return $this->success('COMMENTS_RETRIEVED', 'Comments retrieved',
            CommentResource::collection($comments)->response()->getData(true)
        );
    }

    public function store(Request $request, Post $post): JsonResponse
    {
        $currentUser = $request->user('sanctum');

        if ($currentUser)
        {
            // автор поста заблокував коментатора
            $blockedByAuthor = $currentUser->isBlockedByTarget($currentUser->id, $post->user_id);
            // коментатор заблокував автора поста
            $blockedByCommenter = $currentUser->isBlockedByTarget($post->user_id, $currentUser->id);

            if ($blockedByAuthor || $blockedByCommenter)
            {
                return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
            }
        }

        $request->validate(['content' => 'required|string|max:32768']);
        $content = $request->input('content');

        $comment = $post->comments()->create([
            'content' => $content,
            'user_id' => $currentUser->id
        ]);

        if ($post->user_id !== $currentUser->id)
        {
            $prefs = $post->user->getNotificationPreferencesFor($currentUser->id, 'comments');

            if ($prefs['should_notify'])
            {
                $post->user->notify(new NewCommentNotification($currentUser, $post, $comment, $prefs['sound']));
            }
        }

        preg_match_all('/@([a-zA-Z0-9_.]+)/', $content, $matches);
        $mentionedUsernames = array_unique($matches[1]);

        if (!empty($mentionedUsernames))
        {
            $mentionedUsers = \App\Models\User::whereIn('username', $mentionedUsernames)->get();

            foreach ($mentionedUsers as $mentionedUser)
            {
                if ($mentionedUser->id !== $currentUser->id && $mentionedUser->id !== $post->user_id)
                {
                     $mentionedUser->notify(new MentionNotification($currentUser, $post, $comment));
                }
            }
        }

        return $this->success('COMMENT_CREATED', 'Comment created', (new CommentResource($comment->load('user')))->resolve(), 201);
    }

    /**
     * Редагування коментаря
     */
    public function update(Request $request, Comment $comment): JsonResponse
    {
        if ($request->user()->id !== $comment->user_id)
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $request->validate(['content' => 'required|string|max:32768']);

        $comment->update(['content' => $request->input('content')]);

        return $this->success('COMMENT_UPDATED', 'Comment updated', (new CommentResource($comment->load('user')))->resolve());
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        // Видаляти може ТІЛЬКИ автор коментаря
        if ($request->user()->id !== $comment->user_id)
        {
            return $this->error('ERR_FORBIDDEN', 'Forbidden', 403);
        }

        $comment->delete();

        return $this->success('COMMENT_DELETED', 'Deleted');
    }

    public function myComments(Request $request): JsonResponse
    {
        $user = $request->user();

        $comments = Comment::where('user_id', $user->id)
            ->with(['user', 'post.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(config('comments.max_paginate'));

        return $this->success('MY_COMMENTS_RETRIEVED', 'My comments',
            CommentResource::collection($comments)->response()->getData(true)
        );
    }
}