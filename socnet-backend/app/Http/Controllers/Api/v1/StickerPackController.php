<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Sticker\StorePackRequest;
use App\Http\Requests\Sticker\UpdatePackRequest;
use App\Http\Resources\Sticker\StickerPackResource;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Стікерпаки
 *
 * API для каталогу стікерів, керування паками та встановлення їх на клавіатуру.
 */
class StickerPackController extends Controller
{
    public function __construct(protected StickerService $stickerService)
    {
    }

    public function store(StorePackRequest $request): JsonResponse
    {
        $user = $request->user();
        $title = $request->validated('title');

        $shortName = $this->stickerService->generateUniqueShortName($title);
        $coverPath = null;

        if ($request->hasFile('cover'))
        {
            $coverPath = $this->stickerService->uploadImage($request->file('cover'), $shortName);
        }

        $pack = StickerPack::create([
            'author_id' => $user->id,
            'title' => $title,
            'short_name' => $shortName,
            'cover_path' => $coverPath,
            'is_published' => $request->boolean('is_published', false)
        ]);

        $user->installedStickerPacks()->attach($pack->id, ['sort_order' => 0]);

        return $this->success('PACK_CREATED', 'Sticker pack created successfully', $pack, 201);
    }

    public function update(UpdatePackRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('edit-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only edit your own packs.', 403);
        }

        $data = $request->only(['title', 'is_published']);

        if ($request->hasFile('cover'))
        {
            $this->stickerService->deleteImage($pack->cover_path);
            $data['cover_path'] = $this->stickerService->uploadImage($request->file('cover'), $pack->short_name);
        }

        $pack->update($data);

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
        $user = $request->user();

        if ($user->installedStickerPacks()->where('pack_id', $pack->id)->exists())
        {
            return $this->error('ERR_ALREADY_INSTALLED', 'Pack is already installed.', 409);
        }

        $maxOrder = $user->installedStickerPacks()->max('user_sticker_packs.sort_order') ?? 0;
        $user->installedStickerPacks()->attach($pack->id, ['sort_order' => $maxOrder + 1]);

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
            'packIds' => 'required|array',
            'packIds.*' => 'exists:sticker_packs,id'
        ]);

        foreach ($request->packIds as $index => $packId)
        {
            $request->user()->installedStickerPacks()->updateExistingPivot($packId, [
                'sort_order' => $index
            ]);
        }

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

        if (!$user)
        {
            return $this->success('MY_PACKS_EMPTY', 'Guest access', []);
        }

        $packs = $user->installedStickerPacks()
            ->with('stickers')
            ->orderBy('user_sticker_packs.sort_order', 'asc')
            ->get();

        return $this->success('MY_PACKS_RETRIEVED', 'Your sticker packs',
            StickerPackResource::collection($packs)
        );
    }
}