<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Personalization\UpdatePersonalizationRequest;
use App\Services\PersonalizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalizationController extends Controller
{
    public function __construct(protected PersonalizationService $personalizationService)
    {
    }

    /**
     * Отримати налаштування персоналізації
     *
     * @group Personalization
     * @authenticated
     * @response 200
     */
    public function show(Request $request): JsonResponse
    {
        $personalization = $request->user()->personalization;
        $bannerImage = $personalization?->banner_image;

        return response()->json([
            'success' => true,
            'code' => 'PERSONALIZATION_RETRIEVED',
            'data' => [
                'personalization' => [
                    'banner_image' => $bannerImage ? asset("storage/" . $bannerImage) : null,
                    'banner_color' => $personalization?->banner_color,
                    'username_color' => $personalization?->username_color,
                ]
            ]
        ], 200);
    }

    /**
     * Оновити персоналізацію
     *
     * @group Personalization
     * @authenticated
     * @response 200
     */
    public function update(UpdatePersonalizationRequest $request): JsonResponse
    {
        $removeBanner = filter_var($request->input('remove_banner_image'), FILTER_VALIDATE_BOOLEAN);

        $personalization = $this->personalizationService->updatePersonalization(
            $request->user(),
            $request->validated(),
            $request->file('banner_image'),
            $removeBanner
        );

        $freshBannerImage = $personalization->banner_image;

        return response()->json([
            'success' => true,
            'code' => 'PERSONALIZATION_UPDATED',
            'data' => [
                'personalization' => [
                    'banner_image' => $freshBannerImage ? asset("storage/" . $freshBannerImage) : null,
                    'banner_color' => $personalization->banner_color,
                    'username_color' => $personalization->username_color,
                ]
            ]
        ], 200);
    }
}