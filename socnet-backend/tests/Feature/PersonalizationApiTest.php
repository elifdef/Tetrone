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

    #[TestDox('1. Отримання налаштувань повертає строгий JSON контракт')]
    public function test_get_settings_returns_strict_contract(): void
    {
        $me = \App\Models\User::factory()->create();
        $response = $this->actingAs($me, 'sanctum')->getJson('/api/v1/settings/personalization');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success', 'code',
                'data' => [
                    'personalization' => [
                        'banner_color', 'username_color', 'banner_image'
                    ]
                ]
            ]);
    }

    #[TestDox('2. Успішне завантаження банера ФІЗИЧНО ЗБЕРІГАЄ ФАЙЛ НА ДИСК')]
    public function test_can_upload_banner_image_and_file_is_saved_to_disk(): void
    {
        $user = User::factory()->create();
        $banner = UploadedFile::fake()->image('banner.png');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'banner_image' => $banner
        ]);

        $response->assertStatus(200);

        $personalization = UserPersonalization::where('user_id', $user->id)->first();
        $this->assertNotNull($personalization->banner_image);

        $this->assertTrue(Storage::disk('public')->exists($personalization->banner_image));
    }

    #[TestDox('3. Видалення банера ФІЗИЧНО ВИДАЛЯЄ ЙОГО З ДИСКА')]
    public function test_can_remove_banner_image_physically(): void
    {
        $user = User::factory()->create();

        $path = UploadedFile::fake()->image('old_banner.png')->storeAs('banners', 'old_banner.png', 'public');

        UserPersonalization::create([
            'user_id' => $user->id,
            'banner_image' => $path,
        ]);

        $this->assertTrue(Storage::disk('public')->exists($path));

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'remove_banner_image' => 'true'
        ]);

        $response->assertStatus(200);

        $this->assertNull(UserPersonalization::where('user_id', $user->id)->first()->banner_image);

        $this->assertFalse(Storage::disk('public')->exists($path));
    }

    #[TestDox('4. XSS Security: Блокування невалідних CSS градієнтів та XSS')]
    public function test_xss_protection_on_css_colors(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/settings/personalization', [
            'banner_color' => 'url("javascript:alert(1)")',
            'username_color' => 'expression(alert(1))'
        ]);

        $response->assertStatus(422);
    }
}