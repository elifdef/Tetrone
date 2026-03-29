<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class ChatEncryptionService
{
    /**
     * Генерує криптографічно стійкий ключ.
     */
    public static function generateEncryptedChatKey(): string
    {
        // 1. Використовуємо random_bytes(32) для справжньої ентропії
        $key = base64_encode(random_bytes(32));
        return Crypt::encryptString($key);
    }

    /**
     * Шифрує дані алгоритмом AES-256-GCM (з автентифікацією).
     */
    public static function encryptPayload(array $data, string $encryptedChatKey): string
    {
        $chatKey = base64_decode(Crypt::decryptString($encryptedChatKey));
        $jsonPayload = json_encode($data);

        // 2. Використовуємо GCM для забезпечення цілісності (MAC)
        $iv = random_bytes(openssl_cipher_iv_length('aes-256-gcm'));
        $tag = '';

        // OPENSSL_RAW_DATA гарантує чистий бінарний вивід
        $encrypted = openssl_encrypt($jsonPayload, 'aes-256-gcm', $chatKey, OPENSSL_RAW_DATA, $iv, $tag);

        // 3. Зберігаємо у гнучкому та стандартизованому JSON-форматі
        $payload = [
            'iv' => base64_encode($iv),
            'data' => base64_encode($encrypted),
            'tag' => base64_encode($tag),
        ];

        return base64_encode(json_encode($payload));
    }

    /**
     * Розшифровує дані.
     * 4. Повертає null у разі порушення цілісності або помилки (бізнес-логіка відділена).
     */
    public static function decryptPayload(string $encryptedPayload, string $encryptedChatKey): ?array
    {
        try
        {
            $chatKey = base64_decode(Crypt::decryptString($encryptedChatKey));
            $decoded = base64_decode($encryptedPayload);

            if ($decoded === false)
            {
                return null;
            }

            $payload = json_decode($decoded, true);

            // Якщо це старий формат (попередні повідомлення з '::') - підтримуємо зворотну сумісність
            if (!$payload || !isset($payload['iv'], $payload['data'], $payload['tag']))
            {
                return self::fallbackCbcDecrypt($decoded, $chatKey);
            }

            $decryptedJson = openssl_decrypt(
                base64_decode($payload['data']),
                'aes-256-gcm',
                $chatKey,
                OPENSSL_RAW_DATA,
                base64_decode($payload['iv']),
                base64_decode($payload['tag'])
            );

            // Якщо $decryptedJson === false, значить $tag не співпав (дані були підмінені)
            if ($decryptedJson === false)
            {
                Log::warning('Chat decryption failed: MAC validation error.');
                return null;
            }

            return json_decode($decryptedJson, true);

        } catch (\Throwable $e)
        {
            Log::error('Chat decryption error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Тимчасовий метод для розшифровки старих повідомлень (алгоритмом CBC).
     * Його можна буде видалити, коли всі старі чати будуть очищені з бази.
     */
    private static function fallbackCbcDecrypt(string $decoded, string $chatKey): ?array
    {
        if (!str_contains($decoded, '::')) return null;

        list($encryptedData, $ivEncoded) = explode('::', $decoded, 2);

        // Зворотна сумісність зі старим підходом
        $fallbackKey = Crypt::decryptString(Crypt::encryptString($chatKey)); // імітація старого ключа, якщо він був збережений як рядок

        $decryptedJson = openssl_decrypt($encryptedData, 'aes-256-cbc', $chatKey, 0, base64_decode($ivEncoded));

        return $decryptedJson ? json_decode($decryptedJson, true) : null;
    }
}