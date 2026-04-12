<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    #[TestDox('1. Успішна реєстрація створює юзера і повертає ПОВНИЙ контракт (201)')]
    public function test_can_register_user_with_strict_contract(): void
    {
        config(['features.allow_registration' => true]);

        $payload = [
            'username' => 'newuser123',
            'email' => 'new@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ];

        $response = $this->postJson('/api/v1/sign-up', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('code', 'REGISTER_SUCCESS')
            ->assertJsonStructure([
                'success',
                'code',
                'data' => [
                    'token',
                    'user' => ['id', 'username', 'email', 'avatar']
                ]
            ]);

        $user = User::where('email', 'new@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('newuser123', $user->username);
        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertFalse((bool)$user->is_banned);
    }

    #[TestDox('2. Реєстрація відхиляється (422) при порушенні валідації')]
    public function test_registration_validation_rules(): void
    {
        config(['features.allow_registration' => true]);

        $response = $this->postJson('/api/v1/sign-up', [
            'username' => '1_bad.name!',
            'email' => 'not-an-email',
            'password' => '123',
            'password_confirmation' => '321'
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'ERR_VALIDATION')
            ->assertJsonStructure([
                'data' => ['username', 'email', 'password']
            ]);
    }

    #[TestDox('3. Реєстрація відхиляється (403), якщо вимкнена в конфігу')]
    public function test_cannot_register_if_suspended(): void
    {
        config(['features.allow_registration' => false]);

        $response = $this->postJson('/api/v1/sign-up', [
            'username' => 'newuser123',
            'email' => 'new@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ]);

        $response->assertStatus(403)->assertJsonPath('code', 'ERR_REGISTRATION_SUSPENDED');
        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);
    }

    #[TestDox('4. Успішний логін за email/username повертає ПОВНИЙ контракт і записує історію')]
    public function test_can_login_with_strict_contract_and_history(): void
    {
        $user = User::factory()->create([
            'username' => 'testlogin',
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $responseEmail = $this->postJson('/api/v1/sign-in', [
            'login' => 'test@example.com',
            'password' => 'password123'
        ]);

        $responseUsername = $this->postJson('/api/v1/sign-in', [
            'login' => 'testlogin',
            'password' => 'password123'
        ]);

        foreach ([$responseEmail, $responseUsername] as $response)
        {
            $response->assertStatus(200)
                ->assertJsonPath('code', 'LOGIN_SUCCESS')
                ->assertJsonStructure([
                    'data' => [
                        'token',
                        'user' => ['id', 'username']
                    ]
                ]);
        }


        $this->assertDatabaseHas('login_histories', ['user_id' => $user->id]);
    }

    #[TestDox('5. Захист від Brute Force (Rate Limiting) працює (429)')]
    public function test_login_rate_limiting(): void
    {
        $user = User::factory()->create(['password' => Hash::make('password123')]);

        for ($i = 0; $i < 5; $i++)
        {
            $this->postJson('/api/v1/sign-in', [
                'login' => $user->email,
                'password' => 'wrongpass'
            ])->assertStatus(401);
        }

        $this->postJson('/api/v1/sign-in', [
            'login' => $user->email,
            'password' => 'wrongpass'
        ])->assertStatus(429);
    }

    #[TestDox('6. Логаут видаляє ТІЛЬКИ поточний токен (не розлогінює з інших пристроїв)')]
    public function test_logout_deletes_only_current_token(): void
    {
        $user = User::factory()->create();

        $phoneToken = $user->createToken('phone_session')->plainTextToken;
        $pcToken = $user->createToken('pc_session')->plainTextToken;

        $response = $this->withToken($phoneToken)->postJson('/api/v1/sign-out');

        $response->assertStatus(200)->assertJsonPath('code', 'LOGOUT_SUCCESS');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($pcToken)->getJson('/api/v1/activity/counts')->assertStatus(200);
    }

    #[TestDox('7. Анонімний юзер отримує 401 при спробі виходу')]
    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/v1/sign-out')->assertStatus(401);
    }
}