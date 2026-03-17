<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_overrides', function (Blueprint $table)
        {
            $table->id();
            //хто налаштовує
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // кого налаштовують
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();

            // Якщо true -> від нього взагалі не приходять сповіщення
            $table->boolean('is_muted')->default(false);

            $table->string('custom_sound')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'target_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_overrides');
    }
};