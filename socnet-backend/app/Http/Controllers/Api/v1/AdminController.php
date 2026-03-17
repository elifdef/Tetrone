<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\AdminUserResource;
use App\Models\Appeal;
use App\Models\Report;
use App\Models\User;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\PostResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use App\Notifications\ReportReviewedNotification;

class AdminController extends Controller
{
    /**
     * профіль конкретного користувача
     */
    public function getUserProfile(User $user)
    {
        Gate::authorize('manage-users');
        $user->loadCount(['posts', 'comments', 'likes'])
            ->load(['loginHistories' => function ($q)
            {
                $q->limit(10);
            }, 'moderationLogs.admin']);

        return new AdminUserResource($user);
    }

    /**
     * отримати список усіх користувачів
     */
    public function getUsers(Request $request): JsonResponse
    {
        Gate::authorize('manage-users');

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

    /**
     * Список постів для модерації
     */
    public function getPosts(Request $request): JsonResponse
    {
        Gate::authorize('delete-any-content');

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

    /**
     * мут
     */
    public function toggleMute(Request $request, User $user): JsonResponse
    {
        Gate::authorize('manage-users');

        if ($user->role->value >= $request->user()->role->value)
        {
            return $this->error('ERR_PERMISSION_DENIED', 'You do not have permission to mute this user.', 403);
        }

        $user->is_muted = !$user->is_muted;
        $user->save();

        $action = $user->is_muted ? 'muted' : 'unmuted';

        // лог
        $user->moderationLogs()->create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'reason' => $request->input('reason', 'Reason not specified')
        ]);

        return $this->success('USER_MUTE_TOGGLED', "User successfully $action.", ['is_muted' => $user->is_muted]);
    }

    /**
     * бан
     */
    public function toggleBan(Request $request, User $user): JsonResponse
    {
        Gate::authorize('manage-users');

        if ($user->role->value >= $request->user()->role->value)
        {
            return $this->error('ERR_PERMISSION_DENIED', 'You do not have permission to ban this user.', 403);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        if ($user->is_banned)
        {
            $user->tokens()->delete();
        }

        $action = $user->is_banned ? 'banned' : 'unbanned';

        // лог
        $user->moderationLogs()->create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'reason' => $request->input('reason', 'Reason not specified')
        ]);

        return $this->success('USER_BAN_TOGGLED', "Account successfully $action.", ['is_banned' => $user->is_banned]);
    }

    /**
     * отримати список скарг
     */
    public function getReports(Request $request): JsonResponse
    {
        Gate::authorize('delete-any-content');

        $stats = [
            'total' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'rejected' => Report::where('status', 'rejected')->count(),
        ];

        $query = Report::with(['reporter', 'moderator', 'reportable'])->latest();

        if ($request->has('status') && in_array($request->status, ['pending', 'resolved', 'rejected']))
        {
            $query->where('status', $request->status);
        }

        $reports = $query->paginate(20);

        return $this->success('REPORTS_RETRIEVED', 'Reports retrieved', [
            'stats' => $stats,
            'reports' => $reports
        ]);
    }

    /**
     * задовольнити скаргу
     */
    public function resolveReport(Request $request, Report $report): JsonResponse
    {
        Gate::authorize('delete-any-content');

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $modelName = class_basename($report->reportable_type);

        $report->update([
            'status' => 'resolved',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        $report->reporter->notify(new ReportReviewedNotification($report));

        // перевірка ієрархії ролей
        if ($modelName === 'User' && $report->reportable)
        {
            $targetUser = $report->reportable;

            if ($targetUser->role->value >= $request->user()->role->value)
            {
                return $this->error('ERR_PERMISSION_DENIED', 'You cannot block a user with an equal or higher role!', 403);
            }

            // блокуємо і ЗБЕРІГАЄМО ПРИЧИНУ
            $targetUser->is_banned = true;
            $targetUser->ban_reason = $request->admin_response;
            $targetUser->save();
            $targetUser->tokens()->delete();

            // запис в історію порушень
            $targetUser->moderationLogs()->create([
                'admin_id' => $request->user()->id,
                'action' => 'banned',
                'reason' => 'Ban on complaint: ' . $request->admin_response
            ]);
        }

        // видалення контенту
        if (in_array($modelName, ['Post', 'Comment']) && $report->reportable)
        {
            if ($modelName === 'Post')
            {
                foreach ($report->reportable->attachments as $attachment)
                {
                    Storage::disk('public')->delete($attachment->file_path);
                }
            }
            $report->reportable->delete();
        }

        // закриваємо дублікати скарг на цей же контент
        Report::where('reportable_type', $report->reportable_type)
            ->where('reportable_id', $report->reportable_id)
            ->where('status', 'pending')
            ->where('id', '!=', $report->id)
            ->update([
                'status' => 'resolved',
                'moderator_id' => $request->user()->id,
                'admin_response' => 'Content was deleted due to multiple reports. (Auto-closed)'
            ]);

        return $this->success('REPORT_RESOLVED', 'Report resolved. Content deleted.');
    }

    /**
     * відхилити скаргу
     */
    public function rejectReport(Request $request, Report $report): JsonResponse
    {
        Gate::authorize('delete-any-content');

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $report->update([
            'status' => 'rejected',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        $report->reporter->notify(new ReportReviewedNotification($report));

        return $this->success('REPORT_REJECTED', 'Report rejected. Content remains.');
    }

    /**
     * отримати список апеляцій
     */
    public function getAppeals(Request $request): JsonResponse
    {
        Gate::authorize('manage-users');

        $stats = [
            'total' => Appeal::count(),
            'pending' => Appeal::where('status', 'pending')->count(),
            'approved' => Appeal::where('status', 'approved')->count(),
            'rejected' => Appeal::where('status', 'rejected')->count(),
        ];

        $query = Appeal::with(['user', 'moderator'])->latest();

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected']))
        {
            $query->where('status', $request->status);
        }

        $appeals = $query->paginate(20);

        return $this->success('APPEALS_RETRIEVED', 'Appeals retrieved', [
            'stats' => $stats,
            'appeals' => $appeals
        ]);
    }

    /**
     * схвалити апеляцію
     */
    public function resolveAppeal(Request $request, Appeal $appeal): JsonResponse
    {
        Gate::authorize('manage-users');

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $user = $appeal->user;
        if ($user)
        {
            $user->is_banned = false;
            $user->save();
        }

        $appeal->update([
            'status' => 'approved',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        return $this->success('APPEAL_APPROVED', 'Appeal approved. User unlocked.');
    }

    /**
     * відхилити апеляцію
     */
    public function rejectAppeal(Request $request, Appeal $appeal): JsonResponse
    {
        Gate::authorize('manage-users');

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $appeal->update([
            'status' => 'rejected',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        return $this->success('APPEAL_REJECTED', 'Appeal dismissed. Ban remains in force.');
    }
}