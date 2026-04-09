<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Api\v1\Controller;
use App\Http\Requests\Admin\ManageReportRequest;
use App\Models\Report;
use App\Services\Admin\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    /**
     * Список скарг (Панель Адміна)
     *
     * @group Admin - Reports
     * @authenticated
     * @urlParam status string Фільтр за статусом (pending, resolved, rejected). Example: pending
     * @response 200
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Report::class);

        $data = $this->reportService->getReportsWithStats($request->query('status'));

        return response()->json([
            'success' => true,
            'code' => 'REPORTS_RETRIEVED',
            'data' => $data
        ], 200);
    }

    /**
     * Задовольнити скаргу
     *
     * @group Admin - Reports
     * @authenticated
     * @response 200
     */
    public function resolve(ManageReportRequest $request, Report $report): JsonResponse
    {
        $this->authorize('manage', $report);

        $this->reportService->resolve($report, $request->user(), $request->validated('admin_response'));

        return response()->json([
            'success' => true,
            'code' => 'REPORT_RESOLVED'
        ], 200);
    }

    /**
     * Відхилити скаргу
     *
     * @group Admin - Reports
     * @authenticated
     * @response 200
     */
    public function reject(ManageReportRequest $request, Report $report): JsonResponse
    {
        $this->reportService->reject($report, $request->user(), $request->validated('admin_response'));

        return response()->json([
            'success' => true,
            'code' => 'REPORT_REJECTED'
        ], 200);
    }
}