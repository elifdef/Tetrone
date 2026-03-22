<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\CommentResource;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $query = User::query();

        if ($request->has('search') && !empty($request->search))
        {
            $search = $request->search;
            $query->where('username', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        }

        $users = $query->withCount('posts')
            ->latest()
            ->paginate(20);

        return $this->success('USERS_RETRIEVED', 'Users list loaded',
            AdminUserResource::collection($users)->response()->getData(true)
        );
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $user->loadCount(['posts', 'comments', 'likes'])
            ->load(['loginHistories' => function ($q)
            {
                $q->limit(10);
            }, 'moderationLogs.admin']);

        return $this->success('USER_PROFILE_RETRIEVED', 'Profile retrieved', new AdminUserResource($user));
    }

    public function toggleMute(Request $request, User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);
        $this->authorize('moderate', clone $user);

        $user->is_muted = !$user->is_muted;
        $user->save();

        $action = $user->is_muted ? 'muted' : 'unmuted';

        $user->moderationLogs()->create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'reason' => $request->input('reason', 'Reason not specified')
        ]);

        return $this->success('USER_MUTE_TOGGLED', "User successfully {$action}.", ['is_muted' => $user->is_muted]);
    }

    public function toggleBan(Request $request, User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);
        $this->authorize('moderate', clone $user);

        $user->is_banned = !$user->is_banned;
        $user->save();

        if ($user->is_banned)
        {
            $user->tokens()->delete();
        }

        $action = $user->is_banned ? 'banned' : 'unbanned';

        $user->moderationLogs()->create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'reason' => $request->input('reason', 'Reason not specified')
        ]);

        return $this->success('USER_BAN_TOGGLED', "Account successfully {$action}.", ['is_banned' => $user->is_banned]);
    }

    public function posts(User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $posts = $user->posts()
            ->with(['user', 'targetUser', 'attachments'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(15);

        return $this->success('ADMIN_USER_POSTS', 'User posts retrieved', PostResource::collection($posts)->response()->getData(true));
    }

    public function comments(User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $comments = $user->comments()
            ->with(['post.user'])
            ->latest()
            ->paginate(15);

        return $this->success('ADMIN_USER_COMMENTS', 'User comments retrieved', CommentResource::collection($comments)->response()->getData(true));
    }

    public function likes(User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $posts = Post::select('posts.*')
            ->join('likes', 'posts.id', '=', 'likes.post_id')
            ->where('likes.user_id', $user->id)
            ->with(['user', 'attachments'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->orderBy('likes.created_at', 'desc')
            ->paginate(15);

        return $this->success('ADMIN_USER_LIKES', 'User liked posts retrieved', PostResource::collection($posts)->response()->getData(true));
    }

    public function sessions(User $user): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $tokens = $user->tokens()->orderBy('last_used_at', 'desc')->get();
        return $this->success('ADMIN_USER_SESSIONS', 'User sessions retrieved', $tokens);
    }
}