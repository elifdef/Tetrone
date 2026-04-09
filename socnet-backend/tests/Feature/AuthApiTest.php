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

    #[TestDox('1. Успішна реєстрація створює юзера (201)')]
    public function test_can_register_user(): void
    {
        config(['features.allow_registration' => true]);

        $response = $this->postJson('/api/v1/sign-up', [
            'username' => 'newuser123',
            'email' => 'new@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!'
        ]);

        $response->assertStatus(201)->assertJsonPath('code', 'REGISTER_SUCCESS');
        $this->assertDatabaseHas('users', ['username' => 'newuser123', 'email' => 'new@example.com']);
    }

    #[TestDox('2. Реєстрація відхиляється (403), якщо вимкнена в конфігу')]
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
    }

    #[TestDox('3. Успішний логін за email')]
    public function test_can_login_with_email(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $response = $this->postJson('/api/v1/sign-in', [
            'login' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'LOGIN_SUCCESS');
        $this->assertNotNull($response->json('data.token'));
    }

    #[TestDox('4. Успішний логін за username')]
    public function test_can_login_with_username(): void
    {
        User::factory()->create([
            'username' => 'testuser',
            'password' => Hash::make('password123')
        ]);

        $response = $this->postJson('/api/v1/sign-in', [
            'login' => 'testuser',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)->assertJsonPath('code', 'LOGIN_SUCCESS');
        $this->assertNotNull($response->json('data.token'));
    }

    #[TestDox('5. Логін з неправильним паролем повертає 401')]
    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $response = $this->postJson('/api/v1/sign-in', [
            'login' => 'test@example.com',
            'password' => 'wrongpass'
        ]);

        $response->assertStatus(401)->assertJsonPath('code', 'ERR_INVALID_CREDENTIALS');
    }

    #[TestDox('6. Успішний вихід (видалення поточного токена)')]
    public function test_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token');

        $response = $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/sign-out');

        $response->assertStatus(200)->assertJsonPath('code', 'LOGOUT_SUCCESS');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    #[TestDox('7. Анонімний юзер отримує 401 при спробі виходу')]
    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/v1/sign-out')->assertStatus(401);
    }
}