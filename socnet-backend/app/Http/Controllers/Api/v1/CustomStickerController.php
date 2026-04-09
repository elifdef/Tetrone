<?php

namespace App\Http\Controllers\Api\v1;

use App\Exceptions\ApiException;
use App\Http\Requests\Sticker\StoreStickerRequest;
use App\Http\Requests\Sticker\UpdateStickerRequest;
use App\Http\Resources\Sticker\StickerResource;
use App\Models\CustomSticker;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomStickerController extends Controller
{
    public function __construct(protected StickerService $stickerService)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q');

        if (!$query || mb_strlen($query) < 2)
        {
            return response()->json(['success' => true, 'code' => 'SUCCESS', 'data' => []], 200);
        }

        $user = $request->user();
        $myPackIds = StickerPack::where('author_id', $user->id)
            ->orWhereHas('installedByUsers', fn($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        $stickers = CustomSticker::whereIn('pack_id', $myPackIds)
            ->where(function ($q) use ($query)
            {
                $q->where('shortcode', 'like', $query . '%')
                    // Використовуємо LIKE замість FullText, щоб SQLite не кидав 500 помилку в тестах
                    ->orWhere('keywords', 'like', '%' . $query . '%');
            })
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'code' => 'STICKERS_FOUND',
            'data' => StickerResource::collection($stickers)
        ], 200);
    }

    public function store(StoreStickerRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id)
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $sticker = $this->stickerService->addSticker($pack, $request->validated(), $request->file('file'));

        return response()->json([
            'success' => true,
            'code' => 'STICKER_ADDED',
            'data' => new StickerResource($sticker)
        ], 201);
    }

    public function update(UpdateStickerRequest $request, CustomSticker $sticker): JsonResponse
    {
        if ($sticker->pack->author_id !== $request->user()->id)
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $sticker->update($request->only(['shortcode', 'keywords']));

        return response()->json([
            'success' => true,
            'code' => 'STICKER_UPDATED',
            'data' => new StickerResource($sticker)
        ], 200);
    }

    public function destroy(Request $request, CustomSticker $sticker): JsonResponse
    {
        if ($sticker->pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $this->stickerService->deleteImage($sticker->file_path);
        $sticker->delete();

        return response()->json(['success' => true, 'code' => 'STICKER_DELETED'], 200);
    }

    public function reorder(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id)
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:custom_stickers,id',
            'items.*.sort_order' => 'required|integer'
        ]);

        foreach ($request->items as $item)
        {
            CustomSticker::where('id', $item['id'])
                ->where('pack_id', $pack->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true, 'code' => 'STICKERS_REORDERED'], 200);
    }
}