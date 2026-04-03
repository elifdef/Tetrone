<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Sticker\StorePackRequest;
use App\Http\Requests\Sticker\UpdatePackRequest;
use App\Http\Resources\Sticker\StickerPackResource;
use App\Http\Resources\Sticker\StickerResource;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StickerPackController extends Controller
{
    public function __construct(protected StickerService $stickerService)
    {
    }

    public function info(Request $request, StickerPack $pack): JsonResponse
    {
        $pack->load(['author', 'stickers']);
        $packData = (new StickerPackResource($pack))->resolve();
        $packData['is_deleted'] = $pack->trashed();

        return $this->success('STICKER_INFO_RETRIEVED', 'Pack info retrieved', [
            'pack' => $packData,
            'samples' => StickerResource::collection($pack->stickers->take(4))
        ]);
    }

    public function store(StorePackRequest $request): JsonResponse
    {
        $pack = $this->stickerService->createPack(
            $request->user(),
            $request->validated(),
            $request->file('cover')
        );

        return $this->success('PACK_CREATED', 'Sticker pack created successfully', $pack, 201);
    }

    public function update(UpdatePackRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('edit-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only edit your own packs.', 403);
        }

        $this->stickerService->updatePack($pack, $request->validated(), $request->file('cover'));

        return $this->success('PACK_UPDATED', 'Sticker pack updated', $pack);
    }

    public function destroy(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only delete your own packs.', 403);
        }

        $pack->delete(); // Soft delete
        return $this->success('PACK_DELETED', 'Sticker pack deleted');
    }

    public function install(Request $request, StickerPack $pack): JsonResponse
    {
        $installed = $this->stickerService->installPack($request->user(), $pack);

        if (!$installed)
        {
            return $this->error('ERR_ALREADY_INSTALLED', 'Pack is already installed.', 409);
        }
        return $this->success('PACK_INSTALLED', 'Pack added to your keyboard');
    }

    public function uninstall(Request $request, StickerPack $pack): JsonResponse
    {
        $request->user()->installedStickerPacks()->detach($pack->id);
        return $this->success('PACK_UNINSTALLED', 'Pack removed from your keyboard');
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'packShortNames' => 'required|array',
            'packShortNames.*' => 'exists:sticker_packs,short_name'
        ]);

        $this->stickerService->reorderUserPacks($request->user(), $request->packShortNames);

        return $this->success('PACKS_REORDERED', 'Packs order updated');
    }

    public function catalog(): JsonResponse
    {
        $packs = StickerPack::where('is_published', true)
            ->with(['stickers', 'author'])
            ->withCount('stickers')
            ->paginate(15);

        return $this->success('CATALOG_RETRIEVED', 'Sticker packs catalog',
            StickerPackResource::collection($packs)->response()->getData(true)
        );
    }

    public function myPacks(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        if (!$user) return $this->success('MY_PACKS_EMPTY', 'Guest access', []);

        $packs = $user->installedStickerPacks()
            ->withTrashed()
            ->with('stickers')
            ->orderBy('user_sticker_packs.sort_order', 'asc')
            ->get();

        return $this->success('MY_PACKS_RETRIEVED', 'Your sticker packs',
            StickerPackResource::collection($packs)
        );
    }
}