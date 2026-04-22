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

    /**
     * Отримати статистику для дашборду
     *
     * Повертає зведену інформацію, дані для графіків, список користувачів онлайн та метрики сервера.
     *
     * @group Admin - Dashboard
     * @authenticated
     * @response 200
     */
    public function getStats(): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        return response()->json([
            'success' => true,
            'code' => 'DASHBOARD_STATS_RETRIEVED',
            'data' => $this->dashboardService->getDashboardData()
        ], 200);
    }
}