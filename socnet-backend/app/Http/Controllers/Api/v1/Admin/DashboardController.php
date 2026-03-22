<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Models\User;
use App\Services\Admin\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboardService)
    {
    }

    public function getStats(): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);
        $data = $this->dashboardService->getDashboardData();

        return $this->success('DASHBOARD_STATS_RETRIEVED', 'Stats retrieved', $data);
    }
}