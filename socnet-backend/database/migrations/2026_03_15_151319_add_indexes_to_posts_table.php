<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table)
        {
            // Індекс для швидкого пошуку чужих постів на моїй стіні
            $table->index(['target_user_id', 'created_at']);

            // Індекс для моїх власних постів
            $table->index(['user_id', 'target_user_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table)
        {
            // Щоб JOIN для перевірки на бан працював миттєво
            $table->index('is_banned');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table)
        {
            $table->dropIndex(['target_user_id', 'created_at']);
            $table->dropIndex(['user_id', 'target_user_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table)
        {
            $table->dropIndex(['is_banned']);
        });
    }
};