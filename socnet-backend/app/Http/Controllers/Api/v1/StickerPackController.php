<?php

namespace App\Http\Controllers\Api\v1;

use App\Exceptions\ApiException;
use App\Http\Requests\Sticker\StorePackRequest;
use App\Http\Requests\Sticker\UpdatePackRequest;
use App\Http\Resources\Sticker\StickerPackResource;
use App\Http\Resources\Sticker\StickerResource;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StickerPackController extends Controller
{
    public function __construct(protected StickerService $stickerService)
    {
    }

    /**
     * Інформація про стікер-пак
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function info(Request $request, StickerPack $pack): JsonResponse
    {
        $pack->load(['author', 'stickers']);
        $packData = (new StickerPackResource($pack))->resolve();
        $packData['is_deleted'] = $pack->trashed();

        return response()->json([
            'success' => true,
            'code' => 'STICKER_INFO_RETRIEVED',
            'data' => [
                'pack' => $packData,
                'samples' => StickerResource::collection($pack->stickers->take(4))
            ]
        ], 200);
    }

    /**
     * Створити новий пак
     *
     * @group Sticker Packs
     * @authenticated
     * @response 201
     */
    public function store(StorePackRequest $request): JsonResponse
    {
        $pack = $this->stickerService->createPack(
            $request->user(),
            $request->validated(),
            $request->file('cover')
        );

        return response()->json([
            'success' => true,
            'code' => 'PACK_CREATED',
            'data' => new StickerPackResource($pack)
        ], 201);
    }

    /**
     * Оновити пак
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function update(UpdatePackRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('edit-any-content'))
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $this->stickerService->updatePack($pack, $request->validated(), $request->file('cover'));

        return response()->json([
            'success' => true,
            'code' => 'PACK_UPDATED',
            'data' => new StickerPackResource($pack)
        ], 200);
    }

    /**
     * Видалити пак
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function destroy(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            throw new ApiException('ERR_FORBIDDEN', 403);
        }

        $pack->delete();
        return response()->json(['success' => true, 'code' => 'PACK_DELETED'], 200);
    }

    /**
     * Встановити пак
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function install(Request $request, StickerPack $pack): JsonResponse
    {
        $this->stickerService->installPack($request->user(), $pack);
        return response()->json(['success' => true, 'code' => 'PACK_INSTALLED'], 200);
    }

    /**
     * Видалити встановлений пак з клавіатури
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function uninstall(Request $request, StickerPack $pack): JsonResponse
    {
        $request->user()->installedStickerPacks()->detach($pack->id);
        return response()->json(['success' => true, 'code' => 'PACK_UNINSTALLED'], 200);
    }

    /**
     * Змінити порядок паків
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'packShortNames' => 'required|array',
            'packShortNames.*' => 'exists:sticker_packs,short_name'
        ]);

        $this->stickerService->reorderUserPacks($request->user(), $request->packShortNames);

        return response()->json(['success' => true, 'code' => 'PACKS_REORDERED'], 200);
    }

    /**
     * Каталог публічних паків
     *
     * @group Sticker Packs
     * @response 200
     */
    public function catalog(): AnonymousResourceCollection
    {
        $packs = StickerPack::where('is_published', true)
            ->with(['stickers', 'author'])
            ->withCount('stickers')
            ->paginate(15);

        return StickerPackResource::collection($packs)->additional([
            'success' => true,
            'code' => 'CATALOG_RETRIEVED'
        ]);
    }

    /**
     * Мої встановлені паки
     *
     * @group Sticker Packs
     * @authenticated
     * @response 200
     */
    public function myPacks(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        if (!$user)
        {
            return response()->json(['success' => true, 'code' => 'MY_PACKS_EMPTY', 'data' => []], 200);
        }

        $packs = $user->installedStickerPacks()
            ->withTrashed()
            ->with('stickers')
            ->orderBy('user_sticker_packs.sort_order', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'code' => 'MY_PACKS_RETRIEVED',
            'data' => StickerPackResource::collection($packs)
        ], 200);
    }
}