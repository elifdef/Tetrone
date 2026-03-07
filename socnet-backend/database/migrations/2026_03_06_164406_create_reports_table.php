<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table)
        {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();

            $table->string('reportable_type');
            $table->string('reportable_id');
            $table->string('reason');
            $table->text('details')->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_response')->nullable();

            $table->index(['reportable_type', 'reportable_id']);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};