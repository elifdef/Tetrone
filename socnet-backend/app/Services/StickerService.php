<?php

namespace App\Services;

use App\Models\StickerPack;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StickerService
{
    /**
     * Завантаження емодзі або обкладинки
     */
    public function uploadImage(UploadedFile $file, string $folder): string
    {
        $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
       return $file->storeAs("emojis/{$folder}", $filename, 'public');
    }

    /**
     * Видалення файлу з диска
     */
    public function deleteImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path))
        {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Генерація безпечного short_name для пака
     */
    public function generateUniqueShortName(string $title): string
    {
        $slug = Str::slug($title, '_');
        $uniqueSlug = $slug;
        $counter = 1;

        // Перевіряємо, чи немає вже такого (навіть серед видалених)
        while (StickerPack::withTrashed()->where('short_name', $uniqueSlug)->exists())
        {
            $uniqueSlug = $slug . '_' . $counter;
            $counter++;
        }

        return $uniqueSlug;
    }
}