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

    #[TestDox('1. Успішне додавання стікера: перевірка контракту, БД та ФІЗИЧНОГО збереження файлу')]
    public function test_can_add_sticker_to_own_pack_with_file_check(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'My Pack', 'short_name' => 'my_pack']);
        $file = UploadedFile::fake()->image('sticker.png');

        $response = $this->actingAs($me, 'sanctum')
            ->withHeaders(['Accept' => 'application/json'])
            ->post("/api/v1/stickers/packs/{$pack->getRouteKey()}/items", [
                'shortcode' => 'pepe_smile',
                'keywords' => 'pepe, smile',
                'file' => $file
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('code', 'STICKER_ADDED')
            ->assertJsonStructure([
                'success', 'code', 'data' => ['id', 'shortcode', 'url', 'sort_order']
            ]);

        $stickerId = $response->json('data.id');
        $this->assertDatabaseHas('custom_stickers', ['id' => $stickerId, 'shortcode' => 'pepe_smile']);

        $sticker = CustomSticker::find($stickerId);
        $this->assertTrue(Storage::disk('public')->exists($sticker->file_path));
    }

    #[TestDox('2. Захист від MIME Spoofing: не можна завантажити PHP під виглядом PNG')]
    public function test_cannot_upload_malicious_sticker(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Pack', 'short_name' => 'pack']);
        $maliciousFile = UploadedFile::fake()->createWithContent('hack.png', '<?php phpinfo(); ?>')->mimeType('application/x-php');

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/items", [
            'shortcode' => 'hack',
            'file' => $maliciousFile
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('custom_stickers', ['shortcode' => 'hack']);
    }

    #[TestDox('3. Чужий юзер не може оновити стікер і БАЗА НЕ ЗМІНЮЄТЬСЯ')]
    public function test_cannot_update_others_sticker_and_db_is_untouched(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Pack', 'short_name' => 'pack']);
        $sticker = $pack->stickers()->create(['file_path' => 'path.png', 'shortcode' => 'safe_code', 'sort_order' => 1]);

        $response = $this->actingAs($stranger, 'sanctum')->putJson("/api/v1/stickers/{$sticker->getRouteKey()}", [
            'shortcode' => 'hacked'
        ]);

        $response->assertStatus(403);

        $this->assertEquals('safe_code', $sticker->refresh()->shortcode);
    }

    #[TestDox('4. Видалення стікера ФІЗИЧНО видаляє картинку з диска')]
    public function test_can_delete_own_sticker_and_file_is_removed(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Pack', 'short_name' => 'pack']);

        UploadedFile::fake()->image('test.png')->storeAs('stickers', 'test.png', 'public');

        $sticker = $pack->stickers()->create([
            'file_path' => 'stickers/test.png',
            'shortcode' => 'delete_me',
            'sort_order' => 1
        ]);

        $this->assertTrue(Storage::disk('public')->exists('stickers/test.png'));

        $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/stickers/{$sticker->getRouteKey()}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('custom_stickers', ['id' => $sticker->id]);

        $this->assertFalse(Storage::disk('public')->exists('stickers/test.png'));
    }

    #[TestDox('5. Захист від ID Spoofing при зміні порядку стікерів (reorder)')]
    public function test_cannot_reorder_stickers_from_other_packs(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();

        $myPack = StickerPack::create(['author_id' => $me->id, 'title' => 'My Pack', 'short_name' => 'my']);
        $strangerPack = StickerPack::create(['author_id' => $stranger->id, 'title' => 'Str', 'short_name' => 'str']);

        $mySticker = $myPack->stickers()->create(['file_path' => '1.png', 'shortcode' => 's1', 'sort_order' => 1]);
        $strangerSticker = $strangerPack->stickers()->create(['file_path' => '2.png', 'shortcode' => 's2', 'sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/stickers/packs/{$myPack->getRouteKey()}/reorder", [
            'items' => [
                ['id' => $mySticker->id, 'sort_order' => 2],
                ['id' => $strangerSticker->id, 'sort_order' => 1],
            ]
        ]);

        $this->assertEquals(1, $strangerSticker->refresh()->sort_order);
    }
}