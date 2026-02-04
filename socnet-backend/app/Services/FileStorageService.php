<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileStorageService
{
    public function upload(UploadedFile $file, string $folder, string $prefix, ?string $oldPath = null): string
    {
        // видаляємо старий файл, якщо передали шлях
        if ($oldPath)
            $this->delete($oldPath);

        $randomString = bin2hex(random_bytes(8));
        $timestamp = time();
        $extension = $file->getClientOriginalExtension();
        $filename = "{$prefix}-{$timestamp}-{$randomString}.{$extension}";
        return $file->storeAs($folder, $filename, 'public');
    }

    public function delete(?string $path): void
    {
        if (!$path)
            return;

        if (Str::startsWith($path, ['http://', 'https://']))
            $relativePath = str_replace(asset('storage') . '/', '', $path);
        else
            $relativePath = $path;

        if (Storage::disk('public')->exists($relativePath))
            Storage::disk('public')->delete($relativePath);
    }
}