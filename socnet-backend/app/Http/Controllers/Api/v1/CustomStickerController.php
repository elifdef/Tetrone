<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Sticker\StoreStickerRequest;
use App\Http\Requests\Sticker\UpdateStickerRequest;
use App\Http\Resources\Sticker\StickerPackResource;
use App\Http\Resources\Sticker\StickerResource;
use App\Models\CustomSticker;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Стікери
 */
class CustomStickerController extends Controller
{
    public function __construct(protected StickerService $stickerService)
    {
    }

    /**
     * Пошук стікерів (Інлайн)
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q');
        if (!$query || mb_strlen($query) < 2)
        {
            return $this->success('SUCCESS', 'Search query too short', []);
        }

        $user = $request->user();

        $myPackIds = StickerPack::where('author_id', $user->id)
            ->orWhereHas('installedByUsers', fn($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        $stickers = CustomSticker::whereIn('pack_id', $myPackIds)
            ->where(function ($q) use ($query)
            {
                $q->where('shortcode', 'like', $query . '%')
                    ->orWhereFullText('keywords', $query);
            })
            ->limit(20)
            ->get();

        return $this->success('STICKERS_FOUND', 'Stickers retrieved', StickerResource::collection($stickers));
    }

    /**
     * Завантажити стікер в пак
     */
    public function store(StoreStickerRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack?->author_id !== $request->user()?->id)
        {
            return $this->error('ERR_FORBIDDEN', 'You can only add stickers to your own packs.', 403);
        }

        $path = $this->stickerService->uploadImage($request->file('file'), $pack->short_name);

        $maxOrder = $pack->stickers()->max('sort_order') ?? 0;

        $sticker = $pack->stickers()->create([
            'file_path' => $path,
            'shortcode' => $request->validated('shortcode'),
            'keywords' => $request->validated('keywords'),
            'sort_order' => $request->input('sort_order', $maxOrder + 1)
        ]);

        return $this->success('STICKER_ADDED', 'Sticker added to pack', new StickerResource($sticker), 201);
    }

    /**
     * Оновити стікер (Теги)
     */
    public function update(UpdateStickerRequest $request, CustomSticker $sticker): JsonResponse
    {
        if ($sticker?->pack?->author_id !== $request->user()?->id)
        {
            return $this->error('ERR_FORBIDDEN', 'You can only edit your own stickers.', 403);
        }

        $data = $request->only(['shortcode', 'keywords']);

        $sticker->update($data);

        return $this->success('STICKER_UPDATED', 'Sticker updated successfully', new StickerResource($sticker));
    }

    /**
     * Видалити стікер
     */
    public function destroy(Request $request, CustomSticker $sticker): JsonResponse
    {
        if ($sticker->pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only delete your own stickers.', 403);
        }

        $this->stickerService->deleteImage($sticker->file_path);
        $sticker->delete();

        return $this->success('STICKER_DELETED', 'Sticker deleted successfully');
    }

    /**
     * Змінити порядок стікерів в паку
     */
    public function reorder(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id)
        {
            return $this->error('ERR_FORBIDDEN', 'Access denied.', 403);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:stickers,id',
            'items.*.sort_order' => 'required|integer'
        ]);

        foreach ($request->items as $item)
        {
            CustomSticker::where('id', $item['id'])
                ->where('pack_id', $pack->id) // Захист щоб юзер не міняв чужі стікери
                ->update(['sort_order' => $item['sort_order']]);
        }

        return $this->success('STICKERS_REORDERED', 'Sticker order updated');
    }
}