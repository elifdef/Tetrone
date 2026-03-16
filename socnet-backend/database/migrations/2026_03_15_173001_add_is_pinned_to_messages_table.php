<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table)
        {
            $table->boolean('is_pinned')->default(false)->after('is_edited');
        });
    }

    public function down()
    {
        Schema::table('messages', function (Blueprint $table)
        {
            $table->dropColumn('is_pinned');
        });
    }
};