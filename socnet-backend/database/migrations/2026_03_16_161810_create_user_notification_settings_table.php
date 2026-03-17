<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notification_settings', function (Blueprint $table)
        {
            // принцип простий: чи показувати сповіщення чи ні. Якщо да - то який звук?
            // якщо null - дефолтний
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // хтось написав пост
            $table->boolean('notify_wall_posts')->default(true);
            $table->string('sound_wall_posts')->nullable();

            // новий лайк
            $table->boolean('notify_likes')->default(true);
            $table->string('sound_likes')->nullable();

            // новий коментар
            $table->boolean('notify_comments')->default(true);
            $table->string('sound_comments')->nullable();

            // хтось репостнув
            $table->boolean('notify_reposts')->default(true);
            $table->string('sound_reposts')->nullable();

            // якщо хтось хоче добавитись у друзі
            $table->boolean('notify_friend_requests')->default(true);
            $table->string('sound_friend_requests')->nullable();

            // хтось написав повідомлення
            $table->boolean('notify_messages')->default(true);
            $table->string('sound_messages')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notification_settings');
    }
};