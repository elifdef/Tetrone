<?php

namespace App\Console\Commands;

use App\Models\Message;
use App\Services\ChatEncryptionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CleanupOldMessages extends Command
{
    protected $signature = 'messages:cleanup';
    protected $description = 'Permanently delete messages and their attached files that were soft-deleted more than 14 days ago.';

    public function handle(): int
    {
        $cutoffDate = now()->subDays(14);
        $count = 0;
        $filesDeleted = 0;

        // Використовуємо chunkById для оптимізації пам'яті при великій кількості записів
        Message::onlyTrashed()
            ->where('deleted_at', '<', $cutoffDate)
            ->with(['chat' => fn($q) => $q->withTrashed()])
            ->chunkById(100, function ($messages) use (&$count, &$filesDeleted)
            {
                foreach ($messages as $message)
                {
                    $chat = $message->chat;

                    if ($chat)
                    {
                        $payload = ChatEncryptionService::decryptPayload($message->encrypted_payload, $chat->encrypted_dek);

                        if (!empty($payload['files']))
                        {
                            foreach ($payload['files'] as $file)
                            {
                                $path = "private/chats/{$chat->slug}/" . basename($file);
                                if (Storage::disk('local')->exists($path))
                                {
                                    Storage::disk('local')->delete($path);
                                    $filesDeleted++;
                                }
                            }
                        }
                    }

                    // Остаточне фізичне видалення
                    $message->forceDelete();
                    $count++;
                }
            });

        $summary = "Successfully deleted {$count} old messages and {$filesDeleted} files.";
        $this->info($summary);
        Log::info("CleanupOldMessages: " . $summary);

        return self::SUCCESS;
    }
}