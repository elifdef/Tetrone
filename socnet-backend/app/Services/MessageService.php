<?php

namespace App\Services;

use App\Events\MessageDeletedEvent;
use App\Events\MessagesReadEvent;
use App\Models\Chat;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageService
{
    public function sendMessage(Chat $chat, User $sender, array $data, ?array $files): array|Message
    {
        $targetParticipant = $chat->participants()->withTrashed()->where('user_id', '!=', $sender->id)->first();

        if ($targetParticipant)
        {
            $isBlocked = Friendship::where(fn($q) => $q->where('user_id', $sender->id)->where('friend_id', $targetParticipant->user_id))
                ->orWhere(fn($q) => $q->where('user_id', $targetParticipant->user_id)->where('friend_id', $sender->id))
                ->where('status', Friendship::STATUS_BLOCKED)->exists();

            if ($isBlocked) return ['error' => 'ERR_USER_BLOCKED', 'message' => 'User blocked.', 'status' => 403];
        }

        $savedFiles = [];

        try
        {
            return DB::transaction(function () use ($chat, $sender, $data, $files, &$savedFiles, $targetParticipant)
            {
                if ($targetParticipant && $targetParticipant->trashed())
                {
                    $targetParticipant->restore();
                }

                $savedFiles = $this->uploadFiles($chat->slug, $files);

                $payload = [
                    'text' => $data['text'] ?? '',
                    'files' => $savedFiles
                ];

                $message = Message::create([
                    'chat_id' => $chat->id,
                    'sender_id' => $sender->id,
                    'shared_post_id' => $data['shared_post_id'] ?? null,
                    'reply_to_id' => $data['reply_to_id'] ?? null,
                    'encrypted_payload' => ChatEncryptionService::encryptPayload($payload, $chat->encrypted_dek),
                    'is_system' => false
                ]);

                if ($targetParticipant)
                {
                    $prefs = $targetParticipant->user->getNotificationPreferencesFor($sender->id, 'messages');
                    if ($prefs['should_notify'])
                    {
                        $targetParticipant->user->notify(new NewMessageNotification($sender, $message, $chat->slug, $chat->encrypted_dek, $prefs['sound']));
                    }
                }

                $chat->touch();
                return $message;
            });
        } catch (\Exception $e)
        {
            foreach ($savedFiles as $file)
            {
                Storage::disk('local')->delete("private/chats/{$chat->slug}/" . $file);
            }
            throw $e;
        }
    }

    public function updateMessage(Message $message, Chat $chat, array $data, ?array $newFiles, ?array $deletedMedia): array|Message
    {
        $oldPayload = ChatEncryptionService::decryptPayload($message->encrypted_payload, $chat->encrypted_dek);

        if ($oldPayload === null)
        {
            return ['error' => 'ERR_DECRYPTION_FAILED', 'message' => 'Cannot edit corrupted message', 'status' => 500];
        }

        $currentFiles = $oldPayload['files'] ?? [];
        $newUploadedFiles = [];

        try
        {
            return DB::transaction(function () use ($message, $chat, $data, $newFiles, $deletedMedia, $currentFiles, &$newUploadedFiles)
            {

                if (!empty($deletedMedia))
                {
                    foreach ($deletedMedia as $fileToDelete)
                    {
                        if (in_array($fileToDelete, $currentFiles))
                        {
                            Storage::disk('local')->delete("private/chats/{$chat->slug}/" . basename($fileToDelete));
                            $currentFiles = array_diff($currentFiles, [$fileToDelete]);
                        }
                    }
                    $currentFiles = array_values($currentFiles);
                }

                if (!empty($newFiles))
                {
                    $newUploadedFiles = $this->uploadFiles($chat->slug, $newFiles);
                    $currentFiles = array_merge($currentFiles, $newUploadedFiles);
                }

                if (empty($data['text']) && empty($currentFiles) && !$message->shared_post_id)
                {
                    return ['error' => 'ERR_EMPTY_MESSAGE', 'message' => 'Message cannot be empty', 'status' => 422];
                }

                $newPayload = ['text' => $data['text'] ?? '', 'files' => $currentFiles];

                $message->update([
                    'encrypted_payload' => ChatEncryptionService::encryptPayload($newPayload, $chat->encrypted_dek),
                    'is_edited' => true
                ]);

                return $message;
            });
        } catch (\Exception $e)
        {
            foreach ($newUploadedFiles as $file)
            {
                Storage::disk('local')->delete("private/chats/{$chat->slug}/" . $file);
            }
            throw $e;
        }
    }

    public function deleteMessage(Message $message, Chat $chat): void
    {
        DB::transaction(function () use ($message, $chat)
        {
            $message->delete();

            $targetParticipant = $chat->participants()->where('user_id', '!=', $message->sender_id)->first();
            if ($targetParticipant)
            {
                broadcast(new MessageDeletedEvent($chat->slug, $message->id, $targetParticipant->user_id));
            }
        });
    }

    public function markAsRead(Chat $chat, User $user): void
    {
        $updatedCount = Message::where('chat_id', $chat->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($updatedCount > 0)
        {
            $targetParticipant = $chat->participants()->where('user_id', '!=', $user->id)->first();
            if ($targetParticipant)
            {
                broadcast(new MessagesReadEvent($chat->slug, $user->id, $targetParticipant->user_id));
            }
        }
    }

    private function uploadFiles(string $chatSlug, ?array $files): array
    {
        $savedFiles = [];
        if (!empty($files))
        {
            foreach ($files as $file)
            {
                $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
                $file->storeAs("private/chats/{$chatSlug}", $filename, 'local');
                $savedFiles[] = $filename;
            }
        }
        return $savedFiles;
    }
}