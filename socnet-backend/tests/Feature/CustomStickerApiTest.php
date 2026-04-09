<?php

namespace Tests\Feature;

use App\Models\CustomSticker;
use App\Models\StickerPack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class CustomStickerApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    #[TestDox('1. Успішне додавання стікера в свій пак')]
    public function test_can_add_sticker_to_own_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'My Pack', 'short_name' => 'my_pack']);
        $file = UploadedFile::fake()->image('sticker.png');

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/items", [
            'shortcode' => 'pepe_smile',
            'keywords' => 'pepe, smile, happy',
            'file' => $file
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'STICKER_ADDED');
        $this->assertDatabaseHas('custom_stickers', ['pack_id' => $pack->id, 'shortcode' => 'pepe_smile']);
    }

    #[TestDox('2. Неможливо додати стікер в чужий пак (403)')]
    public function test_cannot_add_sticker_to_others_pack(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Pack', 'short_name' => 'pack']);

        $response = $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/items", [
            'shortcode' => 'hack',
            'file' => UploadedFile::fake()->image('hack.png')
        ]);

        $response->assertStatus(403)->assertJsonPath('code', 'ERR_FORBIDDEN');
    }

    #[TestDox('3. Успішне оновлення свого стікера')]
    public function test_can_update_own_sticker(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Pack', 'short_name' => 'pack']);
        $sticker = $pack->stickers()->create(['file_path' => 'path.png', 'shortcode' => 'old', 'sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/stickers/{$sticker->getRouteKey()}", [
            'shortcode' => 'new_code',
            'keywords' => 'new'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'STICKER_UPDATED');
        $this->assertDatabaseHas('custom_stickers', ['id' => $sticker->id, 'shortcode' => 'new_code']);
    }

    #[TestDox('4. Неможливо оновити чужий стікер')]
    public function test_cannot_update_others_sticker(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Pack', 'short_name' => 'pack']);
        $sticker = $pack->stickers()->create(['file_path' => 'path.png', 'shortcode' => 'old', 'sort_order' => 1]);

        $response = $this->actingAs($stranger, 'sanctum')->putJson("/api/v1/stickers/{$sticker->getRouteKey()}", [
            'shortcode' => 'hacked'
        ]);

        $response->assertStatus(403);
    }

    #[TestDox('5. Успішне видалення свого стікера')]
    public function test_can_delete_own_sticker(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Pack', 'short_name' => 'pack']);
        $sticker = $pack->stickers()->create(['file_path' => 'path.png', 'shortcode' => 'delete_me', 'sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/stickers/{$sticker->getRouteKey()}");

        $response->assertStatus(200)->assertJsonPath('code', 'STICKER_DELETED');
        $this->assertDatabaseMissing('custom_stickers', ['id' => $sticker->id]);
    }

    #[TestDox('6. Пошук (search): занадто короткий запит повертає порожній масив')]
    public function test_search_too_short_query(): void
    {
        $me = User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/stickers/search?q=a');

        $response->assertStatus(200)->assertJsonPath('code', 'SUCCESS');
        $this->assertEmpty($response->json('data'));
    }

    #[TestDox('7. Пошук: знаходить стікери тільки у встановлених або власних паках')]
    public function test_search_finds_stickers_in_my_packs(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        $myPack = StickerPack::create(['author_id' => $me->id, 'title' => 'My', 'short_name' => 'my']);
        $myPack->stickers()->create(['file_path' => '1.png', 'shortcode' => 'pepe_smile', 'sort_order' => 1]);

        $strangerPack = StickerPack::create(['author_id' => $stranger->id, 'title' => 'Str', 'short_name' => 'str']);
        $strangerPack->stickers()->create(['file_path' => '2.png', 'shortcode' => 'pepe_sad', 'sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/stickers/search?q=pepe');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('pepe_smile', $response->json('data.0.shortcode'));
    }

    #[TestDox('8. Успішна зміна порядку стікерів (reorder)')]
    public function test_can_reorder_stickers(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Pack', 'short_name' => 'pack']);

        $sticker1 = $pack->stickers()->create(['file_path' => '1.png', 'shortcode' => 's1', 'sort_order' => 1]);
        $sticker2 = $pack->stickers()->create(['file_path' => '2.png', 'shortcode' => 's2', 'sort_order' => 2]);

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/reorder", [
            'items' => [
                ['id' => $sticker1->id, 'sort_order' => 2],
                ['id' => $sticker2->id, 'sort_order' => 1],
            ]
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'STICKERS_REORDERED');

        $this->assertEquals(2, $sticker1->refresh()->sort_order);
        $this->assertEquals(1, $sticker2->refresh()->sort_order);
    }
}