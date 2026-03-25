<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appeals', function (Blueprint $table) {
            $table->id();
            // хто подає апеляцію
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // текст
            $table->text('message');

            // Статус: pending, approved, rejected
            $table->string('status')->default('pending');

            // хто з адмінів/модерів зробив рішення
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_response')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appeals');
    }
};