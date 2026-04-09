<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Privacy\StorePrivacyExceptionRequest;
use App\Http\Requests\Privacy\UpdatePrivacySettingRequest;
use App\Services\PrivacyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacySettingsController extends Controller
{
    public function __construct(protected PrivacyService $privacyService)
    {
    }

    /**
     * Отримати поточні налаштування та список винятків
     *
     * @group Privacy
     * @authenticated
     * @response 200 storage/responses/privacy_settings.json
     */
    public function index(Request $request): JsonResponse
    {
        $data = $this->privacyService->getSettingsAndExceptions($request->user());

        return response()->json([
            'success' => true,
            'code' => 'PRIVACY_SETTINGS_RETRIEVED',
            'data' => $data
        ], 200);
    }

    /**
     * Оновити одне конкретне налаштування
     *
     * @group Privacy
     * @authenticated
     * @response 200
     */
    public function update(UpdatePrivacySettingRequest $request): JsonResponse
    {
        $settings = $this->privacyService->updateSetting(
            $request->user(),
            $request->validated('context'),
            $request->validated('level')
        );

        return response()->json([
            'success' => true,
            'code' => 'PRIVACY_SETTING_UPDATED',
            'data' => $settings
        ], 200);
    }

    /**
     * Додати або оновити виняток (ОКРІМ)
     *
     * @group Privacy
     * @authenticated
     * @response 200
     */
    public function storeException(StorePrivacyExceptionRequest $request): JsonResponse
    {
        $exception = $this->privacyService->storeException(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'code' => 'PRIVACY_EXCEPTION_SAVED',
            'data' => $exception
        ], 200);
    }

    /**
     * Видалити виняток
     *
     * @group Privacy
     * @authenticated
     * @urlParam id integer required ID винятку.
     * @response 200
     */
    public function destroyException(Request $request, $id): JsonResponse
    {
        $this->privacyService->deleteException($request->user(), (int)$id);

        return response()->json([
            'success' => true,
            'code' => 'PRIVACY_EXCEPTION_DELETED'
        ], 200);
    }
}