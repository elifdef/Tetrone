<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sticker_packs', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pack_id')->constrained('sticker_packs')->cascadeOnDelete();
            $table->integer('sort_order')->default(0); // Порядок паків на клавіатурі юзера
            $table->timestamps();

            $table->unique(['user_id', 'pack_id']); // Юзер не може додати один пак двічі
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sticker_packs');
    }
};