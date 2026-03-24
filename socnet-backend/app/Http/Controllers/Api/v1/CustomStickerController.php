<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Requests\Emoji\StoreStickerRequest;
use App\Http\Requests\Emoji\UpdateStickerRequest;
use App\Http\Resources\Emoji\StickerPackResource;
use App\Http\Resources\Emoji\StickerResource;
use App\Models\CustomSticker;
use App\Models\StickerPack;
use App\Services\StickerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Мікростікери (Емодзі)
 */
class CustomStickerController extends Controller
{
    public function __construct(protected StickerService $emojiService)
    {
    }

    /**
     * Інформація для вспливаючого вікна (Tooltip)
     *
     * Віддає дані про емодзі, його пак та 4 інші картинки для прикладу.
     */
    public function info(Request $request, CustomSticker $emoji): JsonResponse
    {
        $pack = $emoji->pack()->with(['author', 'emojis'])->first();
        return $this->success('EMOJI_INFO_RETRIEVED', 'Emoji info retrieved', [
            'emoji' => new StickerResource($emoji),
            'pack' => new StickerPackResource($pack),
            'samples' => StickerResource::collection($pack->emojis->take(4))
        ]);
    }

    /**
     * Пошук емодзі (Інлайн)
     *
     * Шукає емодзі по тегах (keywords) або шорткоду серед встановлених паків юзера.
     * Викликається, коли користувач вводить ":" в текстове поле.
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

        $emojis = CustomSticker::whereIn('pack_id', $myPackIds)
            ->where(function ($q) use ($query)
            {
                $q->where('shortcode', 'like', $query . '%')
                    ->orWhereFullText('keywords', $query);
            })
            ->limit(20)
            ->get();

        return $this->success('EMOJIS_FOUND', 'Emojis retrieved', StickerResource::collection($emojis));
    }

    /**
     * Завантажити емодзі в пак
     */
    public function store(StoreStickerRequest $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id)
        {
            return $this->error('ERR_FORBIDDEN', 'You can only add emojis to your own packs.', 403);
        }

        $path = $this->emojiService->uploadImage($request->file('file'), $pack->short_name);

        $maxOrder = $pack->emojis()->max('sort_order') ?? 0;

        $emoji = $pack->emojis()->create([
            'file_path' => $path,
            'shortcode' => $request->validated('shortcode'),
            'keywords' => $request->validated('keywords'),
            'sort_order' => $request->input('sort_order', $maxOrder + 1)
        ]);

        return $this->success('EMOJI_ADDED', 'Emoji added to pack', $emoji, 201);
    }

    /**
     * Оновити емодзі (Замінити картинку або теги)
     */
    public function update(UpdateStickerRequest $request, CustomSticker $emoji): JsonResponse
    {
        if ($emoji->pack->author_id !== $request->user()->id)
        {
            return $this->error('ERR_FORBIDDEN', 'You can only edit your own emojis.', 403);
        }

        $data = $request->only(['shortcode', 'keywords']);

        if ($request->hasFile('file'))
        {
            $this->emojiService->deleteImage($emoji->file_path);
            $data['file_path'] = $this->emojiService->uploadImage($request->file('file'), $emoji->pack->short_name);
        }

        $emoji->update($data);

        return $this->success('EMOJI_UPDATED', 'Emoji updated successfully', $emoji);
    }

    /**
     * Видалити емодзі
     */
    public function destroy(Request $request, CustomSticker $emoji): JsonResponse
    {
        if ($emoji->pack->author_id !== $request->user()->id && $request->user()->cannot('delete-any-content'))
        {
            return $this->error('ERR_FORBIDDEN', 'You can only delete your own emojis.', 403);
        }

        $this->emojiService->deleteImage($emoji->file_path);
        $emoji->delete();

        return $this->success('EMOJI_DELETED', 'Emoji deleted successfully');
    }

    /**
     * Змінити порядок емодзі в паку
     *
     */
    public function reorder(Request $request, StickerPack $pack): JsonResponse
    {
        if ($pack->author_id !== $request->user()->id)
        {
            return $this->error('ERR_FORBIDDEN', 'Access denied.', 403);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:custom_emojis,id',
            'items.*.sort_order' => 'required|integer'
        ]);

        foreach ($request->items as $item)
        {
            CustomSticker::where('id', $item['id'])
                ->where('pack_id', $pack->id) // Захист щоб юзер не міняв чужі емодзі
                ->update(['sort_order' => $item['sort_order']]);
        }

        return $this->success('EMOJIS_REORDERED', 'Emoji order updated');
    }

    /**
     * Поскаржитись на стікерпак
     */
    public function report(Request $request, StickerPack $pack): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:255'
        ]);

        // TODO: реалізувати

        return $this->success('PACK_REPORTED', 'Pack reported successfully');
    }
}