<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\Role;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable, HasApiTokens, HasFactory;

    protected $fillable = [
        'username',
        'email',
        'password',
        'first_name',
        'last_name',
        'avatar',
        'avatar_post_id',
        'birth_date',
        'bio',
        'country',
        'gender',
        'is_muted',
        'is_banned'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    const defaultAvatar = "/defaultAvatar.jpg";
    const bannedAvatar = "/blockedAvatar.jpg";
    const GENDER_MALE = 1;
    const GENDER_FEMALE = 2;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_setup_complete' => 'boolean',
            'role' => Role::class,
        ];
    }

    protected static function booted()
    {
        static::creating(function ($user)
        {
            // Якщо в конфігу підтвердження НЕ потрібне
            if (!config('features.need_confirm_email'))
            {
                $user->email_verified_at = now();
            }
        });

        // після створення юзера генеруємо йому дефолтні налаштування сповіщень
        static::created(function ($user)
        {
            $user->notificationSettings()->create();
        });
    }

    public function notificationSettings()
    {
        return $this->hasOne(UserNotificationSetting::class)->withDefault([
            'notify_wall_posts' => true,
            'notify_likes' => true,
            'notify_comments' => true,
            'notify_reposts' => true,
            'notify_friend_requests' => true,
            'notify_messages' => true,
        ]);
    }

    public function notificationOverrides()
    {
        return $this->hasMany(NotificationOverride::class, 'user_id');
    }

    public function getNotificationPreferencesFor(int $senderId, string $type)
    {
        // пошук винятка
        $override = $this->notificationOverrides()->where('target_user_id', $senderId)->first();

        // якщо замучений - вихід
        if ($override && $override->is_muted)
        {
            return [
                'should_notify' => false,
                'sound' => null
            ];
        }

        $settings = $this->notificationSettings;

        $notifyColumn = "notify_{$type}";
        $soundColumn = "sound_{$type}";

        // базова перевірка (чи ввімкнені взагалі лайки/повідомлення)
        $shouldNotify = $settings->$notifyColumn ?? true;

        // Пріоритет:
        // 1. Кастомний звук для конкретної людини ->
        // 2. Глобальний звук для дії ->
        // 3. Дефолт (null)
        $sound = null;
        if ($shouldNotify)
        {
            if ($override && $override->custom_sound)
            {
                $sound = $override->custom_sound;
            } else
            {
                $sound = $settings->$soundColumn;
            }
        }

        return [
            'should_notify' => $shouldNotify,
            'sound' => $sound
        ];
    }

    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: function ($value)
            {
                // якщо забанений
                if ($this->is_banned)
                {
                    return self::bannedAvatar;
                }

                return $value ? asset('storage/' . $value) : self::defaultAvatar;
            }
        );
    }

    public function isBlockedByTarget(int $viewerId, int $targetId): bool
    {
        if ($viewerId === $targetId) return false;

        return Friendship::where('user_id', $targetId)
            ->where('friend_id', $viewerId)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->exists();
    }

    public function sentFriendships()
    {
        return $this->belongsToMany(User::class, 'friendships', 'user_id', 'friend_id')
            ->withPivot('status');
    }

    public function receivedFriendships()
    {
        return $this->belongsToMany(User::class, 'friendships', 'friend_id', 'user_id')
            ->withPivot('status');
    }

    public function getAllFriendIds(): Collection
    {
        $initiated = $this->sentFriendships()->wherePivot('status', Friendship::STATUS_ACCEPTED)->pluck('users.id');
        $received = $this->receivedFriendships()->wherePivot('status', Friendship::STATUS_ACCEPTED)->pluck('users.id');

        return $initiated->merge($received)->unique();
    }

    public function getFriendshipStatusWith(?User $currentUser): string
    {
        if (!$currentUser || $currentUser->id === $this->id)
        {
            return 'none';
        }

        $friendship = Friendship::between($this, $currentUser)->first();

        if (!$friendship) return 'none';

        if ($friendship->status === Friendship::STATUS_ACCEPTED) return 'friends';

        if ($friendship->status === Friendship::STATUS_PENDING)
        {
            return $friendship->user_id === $currentUser->id ? 'pending_sent' : 'pending_received';
        }

        if ($friendship->status === Friendship::STATUS_BLOCKED)
        {
            return $friendship->user_id === $currentUser->id ? 'blocked_by_me' : 'blocked_by_target';
        }

        return 'none';
    }

    public function getIsOnlineAttribute()
    {
        return Cache::has('user-online-' . $this->id);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function loginHistories()
    {
        return $this->hasMany(LoginHistory::class)->latest('created_at');
    }

    public function moderationLogs()
    {
        return $this->hasMany(ModerationLog::class)->latest();
    }

    public function personalization()
    {
        return $this->hasOne(UserPersonalization::class)->withDefault(function ($personalization, $user)
        {
            // Математична генерація унікального HSL-градієнта на основі ID
            $id = $user->id ?? rand(1, 9999);
            $hue1 = ($id * 137.5) % 360; // 137.5 - кут золотого перетину
            $hue2 = ($hue1 + 60) % 360;  // Зсув на 60 градусів для красивого переходу

            $personalization->banner_color = "linear-gradient(135deg, hsl({$hue1}, 70%, 50%), hsl({$hue2}, 80%, 50%))";
            $personalization->banner_image = null;
            $personalization->username_color = null;
        });
    }

    public function activities()
    {
        return $this->hasMany(UserActivity::class);
    }

    public function createdStickerPacks()
    {
        return $this->hasMany(StickerPack::class, 'author_id');
    }

    public function installedStickerPacks()
    {
        return $this->belongsToMany(StickerPack::class, 'user_sticker_packs', 'user_id', 'pack_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function favoriteSticker()
    {
        return $this->belongsToMany(CustomSticker::class, 'user_favorite_stickers', 'user_id', 'sticker_id')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }
}