<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sticker_packs', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete(); // Якщо null - системний пак
            $table->string('title');
            $table->string('short_name')->unique();
            $table->string('cover_path')->nullable(); // Обкладинка пака
            $table->boolean('is_published')->default(false); // Чи доступний пак усім у пошуку
            $table->softDeletes(); // Щоб старі повідомлення не ламалися при видаленні пака
            $table->index('is_published');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sticker_packs');
    }
};