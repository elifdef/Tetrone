<?php

namespace Tests\Feature;

use App\Models\StickerPack;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class StickerPackApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    #[TestDox('1. Успішне створення стікер-пака з обкладинкою (БД, Диск, Контракт)')]
    public function test_can_create_sticker_pack_with_cover(): void
    {
        $me = User::factory()->create();
        $cover = UploadedFile::fake()->image('cover.png');

        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/stickers/packs', [
            'title' => 'My Cool Pack',
            'short_name' => 'cool_pack',
            'is_published' => true,
            'cover' => $cover
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('code', 'PACK_CREATED')
            ->assertJsonStructure([
                'data' => ['id', 'title', 'short_name', 'cover_url', 'is_published']
            ]);

        $packId = $response->json('data.id');
        $pack = StickerPack::find($packId);

        $this->assertDatabaseHas('user_sticker_packs', ['user_id' => $me->id, 'pack_id' => $packId]);

        $this->assertNotNull($pack->cover_path);
        $this->assertTrue(Storage::disk('public')->exists($pack->cover_path));
    }

    #[TestDox('2. Адмін реально оновлює чужий пак (DB Check)')]
    public function test_admin_can_update_others_pack_and_db_changes(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => \App\Enums\Role::Admin->value]);
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Bad Title', 'short_name' => 'title']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/stickers/packs/{$pack->getRouteKey()}", [
            'title' => 'Admin Edited'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('sticker_packs', ['id' => $pack->id, 'title' => 'Admin Edited']);
    }

    #[TestDox('3. Privacy Bypass: Чужий юзер не може встановити приватний пак')]
    public function test_cannot_install_private_pack_of_other_user(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $pack = StickerPack::create([
            'author_id' => $owner->id,
            'title' => 'Secret',
            'short_name' => 'secret',
            'is_published' => false
        ]);

        $response = $this->actingAs($stranger, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/install");

        $this->assertContains($response->status(), [403, 404]);
        $this->assertDatabaseMissing('user_sticker_packs', ['user_id' => $stranger->id, 'pack_id' => $pack->id]);
    }

    #[TestDox('4. Privacy Bypass: Чужий юзер не може переглянути інформацію про приватний пак')]
    public function test_cannot_view_info_of_private_pack(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Secret', 'short_name' => 'secret', 'is_published' => false]);

        $response = $this->actingAs($stranger, 'sanctum')->getJson("/api/v1/stickers/{$pack->short_name}/info");

        $this->assertContains($response->status(), [403, 404]);
    }

    #[TestDox('5. Каталог повертає пагінацію і тільки опубліковані паки')]
    public function test_catalog_returns_only_published_with_pagination(): void
    {
        $author = User::factory()->create();
        StickerPack::create(['author_id' => $author->id, 'title' => 'Pub', 'short_name' => 'pub', 'is_published' => true]);
        StickerPack::create(['author_id' => $author->id, 'title' => 'Priv', 'short_name' => 'priv', 'is_published' => false]);

        $response = $this->getJson('/api/v1/stickers/catalog');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'cover_url', 'stickers_count']
                ],
                'links',
                'meta' => ['current_page', 'total']
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Pub', $response->json('data.0.title'));
    }
}