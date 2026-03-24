<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_stickers', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('pack_id')->constrained('sticker_packs')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('shortcode');
            $table->text('keywords')->nullable(); // Теги для пошуку
            $table->integer('sort_order')->default(0); // Для зміни порядку всередині пака
            $table->index('shortcode');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_sticker');
    }
};