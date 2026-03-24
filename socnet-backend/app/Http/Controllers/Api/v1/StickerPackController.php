<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Emoji\StorePackRequest;
use App\Http\Requests\Emoji\UpdatePackRequest;
use App\Http\Resources\Emoji\StickerPackResource;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Мікростікери (Емодзі)
 *
 * API для каталогу мікростікерів, керування паками та встановлення їх на клавіатуру.
 */
class StickerPackController extends Controller
{
    public function __construct(protected StickerService $emojiService)
    {
    }

    /**
     * Каталог публічних паків
     *
     * Повертає список усіх опублікованих паків для магазину (з їхніми емодзі).
     */

    /**
     * Моя клавіатура (Мої паки)
     *
     * Повертає паки, які юзер додав собі, АБО які він сам створив.
     * Відсортовано так, як юзер їх розставив.
     */

    /**
     * Створити новий пак
     *
     * Створює порожній пак. Якщо передано файл обкладинки, завантажує його.
     */
    public function store(StorePackRequest $request): JsonResponse
    {
        $user = $request->user();
        $title = $request->validated('title');

        $shortName = $this->emojiService->generateUniqueShortName($title);
        $coverPath = null;

        if ($request->hasFile('cover'))
        {
            $coverPath = $this->emojiService->uploadImage($request->file('cover'), $shortName);
        }

        $pack = StickerPack::create([
            'author_id' => $user->id,
            'title' => $title,
            'short_name' => $shortName,
            'cover_path' => $coverPath,
            'is_published' => $request->boolean('is_published', false)
        ]);

        $user->installedEmojiPacks()->attach($pack->id, ['sort_order' => 0]);

        return $this->success('PACK_CREATED', 'Emoji pack created successfully', $pack, 201);
    }

    /**
     * Оновити пак
     *
     * Змінити назву, видимість або обкладинку пака.
     */
    public function update(UpdatePackRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('edit-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only edit your own packs.', 403);
        }

        $data = $request->only(['title', 'is_published']);

        if ($request->hasFile('cover'))
        {
            $this->emojiService->deleteImage($pack->cover_path);
            $data['cover_path'] = $this->emojiService->uploadImage($request->file('cover'), $pack->short_name);
        }

        $pack->update($data);

        return $this->success('PACK_UPDATED', 'Emoji pack updated', $pack);
    }

    /**
     * Видалити пак
     *
     * М'яке видалення (Soft Delete). Пак зникає з каталогів, але старі повідомлення не ламаються.
     */
    public function destroy(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only delete your own packs.', 403);
        }

        $pack->delete(); // Soft delete

        return $this->success('PACK_DELETED', 'Emoji pack deleted');
    }

    /**
     * Встановити пак
     *
     * Додає чужий пак на клавіатуру поточного користувача.
     */
    public function install(Request $request, StickerPack $pack): JsonResponse
    {
        $user = $request->user();

        if ($user->installedEmojiPacks()->where('pack_id', $pack->id)->exists())
        {
            return $this->error('ERR_ALREADY_INSTALLED', 'Pack is already installed.', 409);
        }

        $maxOrder = $user->installedEmojiPacks()->max('user_emoji_packs.sort_order') ?? 0;
        $user->installedEmojiPacks()->attach($pack->id, ['sort_order' => $maxOrder + 1]);

        return $this->success('PACK_INSTALLED', 'Pack added to your keyboard');
    }

    /**
     * Видалити пак з клавіатури
     *
     * Прибирає пак зі списку встановлених (але не видаляє його з сервера).
     */
    public function uninstall(Request $request, StickerPack $pack): JsonResponse
    {
        $request->user()->installedEmojiPacks()->detach($pack->id);

        return $this->success('PACK_UNINSTALLED', 'Pack removed from your keyboard');
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'packIds' => 'required|array',
            'packIds.*' => 'exists:emoji_packs,id'
        ]);

        foreach ($request->packIds as $index => $packId)
        {
            $request->user()->installedEmojiPacks()->updateExistingPivot($packId, [
                'sort_order' => $index
            ]);
        }

        return $this->success('PACKS_REORDERED', 'Packs order updated');
    }

    public function catalog(): JsonResponse
    {
        $packs = StickerPack::where('is_published', true)
            ->with(['sticker', 'author'])
            ->withCount('sticker')
            ->paginate(15);

        // Передаємо через ресурс
        return $this->success('CATALOG_RETRIEVED', 'Emoji packs catalog',
            StickerPackResource::collection($packs)->response()->getData(true)
        );
    }

    public function myPacks(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();

        if (!$user) {
            return $this->success('MY_PACKS_EMPTY', 'Guest access', []);
        }

        $packs = $user->installedStickerPacks()
            ->with('emojis')
            ->orderBy('user_sticker_packs.sort_order', 'asc')
            ->get();

        return $this->success('MY_PACKS_RETRIEVED', 'Your emoji packs',
            StickerPackResource::collection($packs)
        );
    }
}