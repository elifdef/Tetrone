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
            // За замовчуванням коментарі увімкнені (false)
            $table->boolean('can_comment')->default(true)->after('is_repost');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table)
        {
            $table->dropColumn('can_comment');
        });
    }
};