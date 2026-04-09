<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\CustomSticker;
use App\Models\StickerPack;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StickerService
{
    public function uploadImage(UploadedFile $file, string $folder): string
    {
        $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
        return $file->storeAs("emojis/{$folder}", $filename, 'public');
    }

    public function deleteImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path))
        {
            Storage::disk('public')->delete($path);
        }
    }

    public function generateUniqueShortName(string $title): string
    {
        $slug = Str::slug($title, '_');
        $uniqueSlug = $slug;
        $counter = 1;

        while (StickerPack::withTrashed()->where('short_name', $uniqueSlug)->exists())
        {
            $uniqueSlug = $slug . '_' . $counter;
            $counter++;
        }

        return $uniqueSlug;
    }

    public function createPack(User $user, array $data, ?UploadedFile $cover = null): StickerPack
    {
        return DB::transaction(function () use ($user, $data, $cover)
        {
            $shortName = $this->generateUniqueShortName($data['title']);
            $coverPath = null;

            if ($cover)
            {
                $coverPath = $this->uploadImage($cover, $shortName);
            }

            $pack = StickerPack::create([
                'author_id' => $user->id,
                'title' => $data['title'],
                'short_name' => $shortName,
                'cover_path' => $coverPath,
                'is_published' => $data['is_published'] ?? false
            ]);

            // Автоматично встановлюємо автору його ж пак
            $user->installedStickerPacks()->attach($pack->id, ['sort_order' => 0]);

            return $pack;
        });
    }

    public function updatePack(StickerPack $pack, array $data, ?UploadedFile $newCover = null): StickerPack
    {
        if ($newCover)
        {
            $this->deleteImage($pack->cover_path);
            $data['cover_path'] = $this->uploadImage($newCover, $pack->short_name);
        }

        $pack->update($data);
        return $pack;
    }

    public function addSticker(StickerPack $pack, array $data, UploadedFile $file): CustomSticker
    {
        $path = $this->uploadImage($file, $pack->short_name);
        $maxOrder = $pack->stickers()->max('sort_order') ?? 0;

        return $pack->stickers()->create([
            'file_path' => $path,
            'shortcode' => $data['shortcode'],
            'keywords' => $data['keywords'] ?? null,
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1)
        ]);
    }

    public function installPack(User $user, StickerPack $pack): void
    {
        if ($user->installedStickerPacks()->where('pack_id', $pack->id)->exists())
        {
            throw new ApiException('ERR_ALREADY_INSTALLED', 409);
        }

        $maxOrder = $user->installedStickerPacks()->max('user_sticker_packs.sort_order') ?? 0;
        $user->installedStickerPacks()->attach($pack->id, ['sort_order' => $maxOrder + 1]);
    }

    public function reorderUserPacks(User $user, array $packShortNames): void
    {
        $packs = StickerPack::whereIn('short_name', $packShortNames)->pluck('id', 'short_name');

        foreach ($packShortNames as $index => $shortName)
        {
            if (isset($packs[$shortName]))
            {
                $user->installedStickerPacks()->updateExistingPivot($packs[$shortName], [
                    'sort_order' => $index
                ]);
            }
        }
    }
}