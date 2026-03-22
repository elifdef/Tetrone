<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\Post;
use App\Models\Comment;
use App\Http\Resources\UserBasicResource;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getDashboardData(): array
    {
        return [
            'summary' => $this->getSummaryStats(),
            'charts' => $this->getChartsData(),
            'realtime' => $this->getRealtimeStats(),
            'server' => $this->getServerMetrics(),
        ];
    }

    private function getSummaryStats(): array
    {
        return [
            'users' => User::count(),
            'posts' => Post::count(),
            'comments' => Comment::count(),
        ];
    }

    private function getChartsData(): array
    {
        $last7Days = Carbon::today()->subDays(6);

        $registrations = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $last7Days)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $postsTimeline = Post::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as posts_count'))
            ->where('created_at', '>=', $last7Days)
            ->groupBy('date')->orderBy('date')->get()->keyBy('date');

        $commentsTimeline = Comment::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as comments_count'))
            ->where('created_at', '>=', $last7Days)
            ->groupBy('date')->orderBy('date')->get()->keyBy('date');

        $contentActivity = [];
        for ($i = 0; $i < 7; $i++)
        {
            $dateString = clone $last7Days;
            $formattedDate = $dateString->addDays($i)->format('Y-m-d');

            $contentActivity[] = [
                'date' => $formattedDate,
                'posts' => $postsTimeline->get($formattedDate)->posts_count ?? 0,
                'comments' => $commentsTimeline->get($formattedDate)->comments_count ?? 0,
            ];
        }

        return [
            'registrations' => $registrations,
            'activity' => $contentActivity
        ];
    }

    private function getRealtimeStats(): array
    {
        $fiveMinutesAgo = Carbon::now()->subMinutes(5);

        $onlineUsers = User::select('id', 'username', 'first_name', 'last_name', 'avatar')
            ->where('last_seen_at', '>=', $fiveMinutesAgo)
            ->orderBy('last_seen_at', 'desc')
            ->limit(10)
            ->get();

        return [
            'online_count' => User::where('last_seen_at', '>=', $fiveMinutesAgo)->count(),
            'users' => UserBasicResource::collection($onlineUsers)->resolve()
        ];
    }

    private function getServerMetrics(): array
    {
        $cpuLoad = function_exists('sys_getloadavg') ? sys_getloadavg()[0] : 0;
        $memoryUsage = memory_get_usage(true) / 1024 / 1024;

        $diskFree = disk_free_space("/") / 1024 / 1024 / 1024;
        $diskTotal = disk_total_space("/") / 1024 / 1024 / 1024;
        $diskUsagePercent = $diskTotal > 0 ? round((($diskTotal - $diskFree) / $diskTotal) * 100) : 0;

        return [
            'cpu_load' => round($cpuLoad, 2),
            'memory_mb' => round($memoryUsage, 2),
            'disk_percent' => $diskUsagePercent,
            'disk_free_gb' => round($diskFree, 1),
            'php_version' => phpversion(),
        ];
    }
}