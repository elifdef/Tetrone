<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_privacy_exceptions', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('context', 32);

            $table->boolean('is_allowed')->default(true);

            $table->timestamps();

            $table->unique(['user_id', 'target_user_id', 'context'], 'user_target_context_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_privacy_exceptions');
    }
};