<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class FileStorageService
{
    public function upload(UploadedFile $file, string $folder, string $prefix, ?string $oldPath = null): string
    {
        // видаляємо старий файл, якщо передали шлях
        if ($oldPath)
        {
            $this->delete($oldPath);
        }

        $randomString = bin2hex(random_bytes(8));
        $timestamp = time();

        $mime = $file->getMimeType();
        // Перевіряємо чи це картинка
        $isImage = str_starts_with($mime, 'image/') && $mime !== 'image/svg+xml' && $mime !== 'image/gif';

        if ($isImage)
        {
            $filename = "{$prefix}-{$timestamp}-{$randomString}.webp";
            $path = "{$folder}/{$filename}";

            $manager = new ImageManager(new Driver());

            $image = $manager->read($file->getPathname());

            $image->scaleDown(width: 1920, height: 1920);

            // Конвертуємо у WebP з якістю 80%
            $encoded = $image->toWebp(80);

            Storage::disk('public')->put($path, $encoded->toString());

            return $path;
        }

        // Якщо це відео, аудіо, документ або GIF - зберігаємо як є
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $filename = "{$prefix}-{$timestamp}-{$randomString}.{$extension}";

        return $file->storeAs($folder, $filename, 'public');
    }

    public function delete(?string $path): void
    {
        if (!$path)
        {
            return;
        }

        $relativePath = Str::startsWith($path, ['http://', 'https://'])
            ? str_replace(asset('storage') . '/', '', $path)
            : $path;

        if (Storage::disk('public')->exists($relativePath))
        {
            Storage::disk('public')->delete($relativePath);
        }
    }
}