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

    #[TestDox('1. Анонімний юзер отримує 401')]
    public function test_guest_gets_401(): void
    {
        $this->postJson('/api/v1/stickers/packs')->assertStatus(401);
    }

    #[TestDox('2. Забанений юзер отримує 403 при створенні пака')]
    public function test_banned_user_gets_403(): void
    {
        $user = User::factory()->create(['is_banned' => true]);
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/stickers/packs')->assertStatus(403);
    }

    #[TestDox('3. Замучений юзер (Read-only) отримує 403 при створенні пака')]
    public function test_muted_user_gets_403(): void
    {
        $user = User::factory()->create(['is_muted' => true]);
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/stickers/packs')->assertStatus(403);
    }

    #[TestDox('4. Непідтверджений юзер отримує 403 при створенні пака')]
    public function test_unverified_user_gets_403(): void
    {
        config(['features.need_confirm_email' => true]);
        $user = User::factory()->unverified()->create();
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/stickers/packs')->assertStatus(403);
    }

    #[TestDox('5. Успішне створення стікер-пака (з авто-встановленням)')]
    public function test_can_create_sticker_pack(): void
    {
        $me = User::factory()->create();
        $cover = UploadedFile::fake()->image('cover.png');

        $response = $this->actingAs($me, 'sanctum')->postJson('/api/v1/stickers/packs', [
            'title' => 'My Cool Pack',
            'is_published' => true,
            'cover' => $cover
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'PACK_CREATED');
        $this->assertDatabaseHas('sticker_packs', ['title' => 'My Cool Pack', 'author_id' => $me->id]);

        $packId = $response->json('data.id');
        $this->assertDatabaseHas('user_sticker_packs', ['user_id' => $me->id, 'pack_id' => $packId]);
    }

    #[TestDox('6. Успішне оновлення свого пака')]
    public function test_can_update_own_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Old Title', 'short_name' => 'old_title']);

        $response = $this->actingAs($me, 'sanctum')->putJson("/api/v1/stickers/packs/{$pack->getRouteKey()}", [
            'title' => 'New Title'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PACK_UPDATED');
        $this->assertDatabaseHas('sticker_packs', ['id' => $pack->id, 'title' => 'New Title']);
    }

    #[TestDox('7. Неможливо оновити чужий пак (403)')]
    public function test_cannot_update_others_pack(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Title', 'short_name' => 'title']);

        $response = $this->actingAs($stranger, 'sanctum')->putJson("/api/v1/stickers/packs/{$pack->getRouteKey()}", [
            'title' => 'Hacked'
        ]);

        $response->assertStatus(403)->assertJsonPath('code', 'ERR_FORBIDDEN');
    }

    #[TestDox('8. Адмін з правами може редагувати чужий пак')]
    public function test_admin_can_update_others_pack(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => \App\Enums\Role::Admin->value]);
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Title', 'short_name' => 'title']);

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/v1/stickers/packs/{$pack->getRouteKey()}", [
            'title' => 'Admin Edited'
        ]);

        $response->assertStatus(200);
    }

    #[TestDox('9. Успішне видалення свого пака')]
    public function test_can_delete_own_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'Title', 'short_name' => 'title']);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/stickers/packs/{$pack->getRouteKey()}");

        $response->assertStatus(200)->assertJsonPath('code', 'PACK_DELETED');
        $this->assertSoftDeleted('sticker_packs', ['id' => $pack->id]);
    }

    #[TestDox('10. Неможливо видалити чужий пак')]
    public function test_cannot_delete_others_pack(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $owner->id, 'title' => 'Title', 'short_name' => 'title']);

        $response = $this->actingAs($stranger, 'sanctum')->deleteJson("/api/v1/stickers/packs/{$pack->getRouteKey()}");
        $response->assertStatus(403);
    }

    #[TestDox('11. Успішне встановлення пака')]
    public function test_can_install_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => User::factory()->create()->id, 'title' => 'T', 'short_name' => 't']);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/install");

        $response->assertStatus(200)->assertJsonPath('code', 'PACK_INSTALLED');
        $this->assertDatabaseHas('user_sticker_packs', ['user_id' => $me->id, 'pack_id' => $pack->id]);
    }

    #[TestDox('12. Конфлікт (409) при спробі встановити вже встановлений пак')]
    public function test_cannot_install_already_installed_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'T', 'short_name' => 't']);
        $me->installedStickerPacks()->attach($pack->id, ['sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->postJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/install");
        $response->assertStatus(409)->assertJsonPath('code', 'ERR_ALREADY_INSTALLED');
    }

    #[TestDox('13. Успішне видалення пака з клавіатури')]
    public function test_can_uninstall_pack(): void
    {
        $me = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $me->id, 'title' => 'T', 'short_name' => 't']);
        $me->installedStickerPacks()->attach($pack->id, ['sort_order' => 1]);

        $response = $this->actingAs($me, 'sanctum')->deleteJson("/api/v1/stickers/packs/{$pack->getRouteKey()}/uninstall");

        $response->assertStatus(200)->assertJsonPath('code', 'PACK_UNINSTALLED');
        $this->assertDatabaseMissing('user_sticker_packs', ['user_id' => $me->id, 'pack_id' => $pack->id]);
    }

    #[TestDox('14. Каталог повертає тільки опубліковані паки')]
    public function test_catalog_returns_only_published(): void
    {
        $author = User::factory()->create();
        StickerPack::create(['author_id' => $author->id, 'title' => 'Pub', 'short_name' => 'pub', 'is_published' => true]);
        StickerPack::create(['author_id' => $author->id, 'title' => 'Priv', 'short_name' => 'priv', 'is_published' => false]);

        $response = $this->getJson('/api/v1/stickers/catalog');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Pub', $response->json('data.0.title'));
    }

    #[TestDox('15. Отримання інформації про пак (через short_name)')]
    public function test_pack_info(): void
    {
        $author = User::factory()->create();
        $pack = StickerPack::create(['author_id' => $author->id, 'title' => 'Test Info', 'short_name' => 'test_info']);

        $response = $this->getJson("/api/v1/stickers/{$pack->short_name}/info");
        $response->assertStatus(200)->assertJsonPath('code', 'STICKER_INFO_RETRIEVED');
        $this->assertEquals('Test Info', $response->json('data.pack.title'));
    }
}