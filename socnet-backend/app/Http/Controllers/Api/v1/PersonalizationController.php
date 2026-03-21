<?php

namespace App\Http\Controllers\Api\v1;

use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PersonalizationController extends Controller
{
    protected $fileService;

    public function __construct(FileStorageService $fileService)
    {
        $this->fileService = $fileService;
    }

    public function show(Request $request): JsonResponse
    {
        $personalization = $request->user()->personalization;
        $bannerImage = $personalization?->banner_image;

        return $this->success('PERSONALIZATION_RETRIEVED', 'Personalization retrieved', [
            'personalization' => [
                'banner_image' => $bannerImage ? asset("storage/" . $bannerImage) : null,
                'banner_color' => $personalization?->banner_color,
                'username_color' => $personalization?->username_color,
            ]
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'banner_color' => 'nullable|string|max:150',
            'username_color' => 'nullable|string|max:50',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_banner_image' => 'nullable|string'
        ]);

        $user = $request->user();

        $personalization = $user->personalization()->firstOrCreate(
            ['user_id' => $user->id]
        );

        if ($request->hasFile('banner_image'))
        {
            if ($personalization->banner_image)
            {
                $oldPath = str_replace('/storage/', '', $personalization->banner_image);
                Storage::disk('public')->delete($oldPath);
            }

            $validated['banner_image'] = $this->fileService->upload(
                file: $request->file('banner_image'),
                folder: $user->username,
                prefix: 'banner'
            );
        } elseif ($request->input('remove_banner_image') === 'true')
        {
            if ($personalization->banner_image)
            {
                $oldPath = str_replace('/storage/', '', $personalization->banner_image);
                Storage::disk('public')->delete($oldPath);
            }
            $validated['banner_image'] = null;
        } else
        {
            unset($validated['banner_image']);
        }

        $personalization->update($validated);

        $freshBannerImage = $personalization->banner_image;

        return $this->success('PERSONALIZATION_UPDATED', 'Personalization updated', [
            'personalization' => [
                'banner_image' => $freshBannerImage ? asset("storage/" . $freshBannerImage) : null,
                'banner_color' => $personalization->banner_color,
                'username_color' => $personalization->username_color,
            ]
        ]);
    }
}