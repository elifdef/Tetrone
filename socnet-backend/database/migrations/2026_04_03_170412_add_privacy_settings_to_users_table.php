<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table)
        {
            // {"avatar": 0, "wall_post": 1, "message": 2}
            $table->json('privacy_settings')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table)
        {
            $table->dropColumn('privacy_settings');
        });
    }
};