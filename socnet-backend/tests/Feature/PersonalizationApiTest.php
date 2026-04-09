<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserPersonalization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class PersonalizationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    #[TestDox('1. Анонімний юзер отримує 401 при отриманні налаштувань')]
    public function test_guest_gets_401_on_show(): void
    {
        $this->getJson('/api/v1/settings/personalization')->assertStatus(401);
    }

    #[TestDox('2. Успішне отримання існуючих налаштувань')]
    public function test_can_get_personalization(): void
    {
        $user = User::factory()->create();
        UserPersonalization::create([
            'user_id' => $user->id,
            'banner_color' => '#FF0000',
            'username_color' => '#00FF00',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/settings/personalization');

        $response->assertStatus(200)->assertJsonPath('code', 'PERSONALIZATION_RETRIEVED');
        $this->assertEquals('#FF0000', $response->json('data.personalization.banner_color'));
    }

    #[TestDox('3. Успішне оновлення лише кольорів (без картинки)')]
    public function test_can_update_colors_only(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'banner_color' => 'linear-gradient(135deg, red, blue)',
            'username_color' => '#123456'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'PERSONALIZATION_UPDATED');
        $this->assertDatabaseHas('user_personalizations', [
            'user_id' => $user->id,
            'username_color' => '#123456'
        ]);
    }

    #[TestDox('4. Успішне завантаження банера')]
    public function test_can_upload_banner_image(): void
    {
        $user = User::factory()->create();
        $banner = UploadedFile::fake()->image('banner.png');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'banner_image' => $banner
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.personalization.banner_image'));

        $this->assertDatabaseMissing('user_personalizations', [
            'user_id' => $user->id,
            'banner_image' => null
        ]);
    }

    #[TestDox('5. Видалення банера через remove_banner_image=true')]
    public function test_can_remove_banner_image(): void
    {
        $user = User::factory()->create();
        UserPersonalization::create([
            'user_id' => $user->id,
            'banner_image' => 'old_banner.png',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'remove_banner_image' => 'true'
        ]);

        $response->assertStatus(200);
        $this->assertNull($response->json('data.personalization.banner_image'));

        $this->assertDatabaseHas('user_personalizations', [
            'user_id' => $user->id,
            'banner_image' => null
        ]);
    }

    #[TestDox('6. Помилка валідації при завантаженні неправильного формату файлу')]
    public function test_validation_fails_on_wrong_file_type(): void
    {
        $user = User::factory()->create();
        $pdf = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'banner_image' => $pdf
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['banner_image']);
    }
}