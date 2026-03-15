<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'avatar' => $this->avatar_url,
            'bio' => $this->bio,
            'role' => $this->role,
            'is_muted' => (bool)$this->is_muted,
            'is_banned' => (bool)$this->is_banned,
            'last_seen' => $this->last_seen_at,
            'created_at' => $this->created_at->toISOString(),
            'posts_count' => $this->whenCounted('posts'),
            'comments_count' => $this->whenCounted('comments'),
            'likes_count' => $this->whenCounted('likes'),

            'personalization' => [
                'banner_color' => $this->personalization->banner_color,
                'username_color' => $this->personalization->username_color,
            ],

            'login_history' => $this->whenLoaded('loginHistories'),
            'moderation_logs' => $this->whenLoaded('moderationLogs', function ()
            {
                return $this->moderationLogs->map(function ($log)
                {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'reason' => $log->reason,
                        'created_at' => $log->created_at->toISOString(),
                        'admin_name' => $log->admin ? $log->admin->first_name . ' ' . $log->admin->last_name : 'Your mom'
                    ];
                });
            }),
            // статистика активності
            'total_active_seconds' => $this->whenLoaded('activities', function ()
            {
                return $this->activities->sum('active_seconds');
            }, 0),

            // історія по днях
            'activity_history' => $this->whenLoaded('activities', function ()
            {
                return $this->activities->map(function ($act)
                {
                    return [
                        'date' => $act->date,
                        'active_seconds' => $act->active_seconds,
                    ];
                });
            }),
        ];
    }
}