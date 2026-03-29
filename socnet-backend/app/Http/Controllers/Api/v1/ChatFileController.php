<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ChatFileController extends Controller
{
    public function show(Request $request, string $slug, string $filename): BinaryFileResponse
    {
        $chat = Chat::where('slug', $slug)->firstOrFail();

        // Перевіряємо, чи є юзер учасником цього чату
        if (!$chat->participants()->where('user_id', $request->user()->id)->exists())
        {
            abort(403, 'Unauthorized access to chat files.');
        }

        $path = "private/chats/{$slug}/{$filename}";

        // Диск 'local' дивиться в storage/app (не публічна папка!)
        if (!Storage::disk('local')->exists($path))
        {
            abort(404, 'File not found.');
        }

        return response()->file(storage_path("app/{$path}"));
    }
}