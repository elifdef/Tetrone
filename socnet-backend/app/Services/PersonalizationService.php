<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPersonalization;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PersonalizationService
{
    public function __construct(protected FileStorageService $fileService)
    {
    }

    public function updatePersonalization(User $user, array $data, ?UploadedFile $bannerImage, bool $removeBanner): UserPersonalization
    {
        $personalization = $user->personalization()->firstOrCreate(['user_id' => $user->id]);

        if ($bannerImage)
        {
            $this->deleteOldBanner($personalization->banner_image);

            $data['banner_image'] = $this->fileService->upload(
                file: $bannerImage,
                folder: $user->username,
                prefix: 'banner'
            );
        } elseif ($removeBanner)
        {
            $this->deleteOldBanner($personalization->banner_image);
            $data['banner_image'] = null;
        } else
        {
            // Якщо не завантажували і не видаляли, не чіпаємо поле
            unset($data['banner_image']);
        }

        // Очищаємо зайве перед апдейтом
        unset($data['remove_banner_image']);

        $personalization->update($data);

        return $personalization;
    }

    protected function deleteOldBanner(?string $path): void
    {
        if ($path)
        {
            $oldPath = str_replace('/storage/', '', $path);
            if (Storage::disk('public')->exists($oldPath))
            {
                Storage::disk('public')->delete($oldPath);
            }
        }
    }
}