<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Support\Str;

class ReportReviewedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $targetType = class_basename($this->report->reportable_type);
        $targetContent = 'Content has been deleted or is unavailable';

        if ($this->report->reportable)
        {
            if ($targetType === 'Post' || $targetType === 'Comment')
            {
                $targetContent = $this->report->reportable->content;
            } elseif ($targetType === 'User')
            {
                $targetContent = $this->report->reportable->first_name . ' ' . $this->report->reportable->last_name;
            }
        }

        $moderatorName = 'Moderator';
        if ($this->report->moderator)
        {
            $moderatorName = trim($this->report->moderator->first_name . ' ' . $this->report->moderator->last_name);
        }

        return [
            'type' => 'report_reviewed',
            'report_id' => $this->report->id,
            'status' => $this->report->status,
            'admin_response' => $this->report->admin_response,
            'moderator_name' => $moderatorName,
            'target_type' => $targetType,
            'target_content' => Str::limit($targetContent, 150),
        ];
    }

    public function toBroadcast($notifiable)
    {
        $data = $this->toArray($notifiable);
        $data['sound'] = null;
        $data['show_toast'] = true;

        return new BroadcastMessage($data);
    }
}