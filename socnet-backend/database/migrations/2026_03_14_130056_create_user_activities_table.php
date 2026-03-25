<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_activities', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // хто сидів
            $table->date('date'); // якого числа
            $table->unsignedBigInteger('active_seconds')->default(0); // скільки секунд насидів

            // один юзер = один запис на один день
            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activities');
    }
};