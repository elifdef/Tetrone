<?php

namespace App\Services\Admin;

use App\Models\Report;
use App\Models\User;
use App\Notifications\ReportReviewedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReportService
{
    /**
     * Отримати статистику та список скарг
     */
    public function getReportsWithStats(?string $statusFilter): array
    {
        $stats = [
            'total' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'rejected' => Report::where('status', 'rejected')->count(),
        ];

        $query = Report::with(['reporter', 'moderator', 'reportable'])->latest();

        if ($statusFilter && in_array($statusFilter, ['pending', 'resolved', 'rejected']))
        {
            $query->where('status', $statusFilter);
        }

        return [
            'stats' => $stats,
            'reports' => $query->paginate(config('admin.max_paginate', 20))
        ];
    }

    public function resolve(Report $report, User $admin, string $response): void
    {
        DB::transaction(function () use ($report, $admin, $response)
        {
            $modelName = class_basename($report->reportable_type);

            // Оновлюємо саму скаргу
            $report->update([
                'status' => 'resolved',
                'moderator_id' => $admin->id,
                'admin_response' => $response
            ]);

            // Якщо це юзер - банимо
            if ($modelName === 'User' && $report->reportable)
            {
                $targetUser = $report->reportable;

                $targetUser->update([
                    'is_banned' => true,
                    'ban_reason' => $response
                ]);
                $targetUser->tokens()->delete();

                $targetUser->moderationLogs()->create([
                    'admin_id' => $admin->id,
                    'action' => 'banned',
                    'reason' => 'Ban on complaint: ' . $response
                ]);
            }

            // Якщо це контент - видаляємо
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

            // Закриваємо дублікати скарг на цей же контент
            Report::where('reportable_type', $report->reportable_type)
                ->where('reportable_id', $report->reportable_id)
                ->where('status', 'pending')
                ->where('id', '!=', $report->id)
                ->update([
                    'status' => 'resolved',
                    'moderator_id' => $admin->id,
                    'admin_response' => 'Content was deleted due to multiple reports. (Auto-closed)'
                ]);

            // Відправляємо сповіщення
            $report->reporter->notify(new ReportReviewedNotification($report));
        });
    }

    public function reject(Report $report, User $admin, string $response): void
    {
        $report->update([
            'status' => 'rejected',
            'moderator_id' => $admin->id,
            'admin_response' => $response
        ]);

        $report->reporter->notify(new ReportReviewedNotification($report));
    }
}