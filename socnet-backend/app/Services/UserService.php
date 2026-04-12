<?php

namespace App\Services;

use App\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(protected FileStorageService $fileService)
    {
    }

    public function getPaginatedUsers(?User $currentUser, ?string $search): LengthAwarePaginator
    {
        $query = User::query();
        if ($currentUser) $query->where('id', '!=', $currentUser->id);

        if ($search)
        {
            $query->where(function ($q) use ($search)
            {
                $q->where('username', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        } else
        {
            $query->latest();
        }
        return $query->paginate(20);
    }

    public function updateProfile(User $targetUser, array $data, ?UploadedFile $avatarFile): void
    {
        $targetUser->fill(collect($data)->except(['avatar', 'remove_avatar', 'finish_setup'])->toArray());

        if (!empty($data['remove_avatar']) && $data['remove_avatar'])
        {
            $targetUser->avatar = null;
            $targetUser->avatar_post_id = null;
        } elseif ($avatarFile)
        {
            $path = $this->fileService->upload($avatarFile, $targetUser->username, 'avatar');

            $post = $targetUser->posts()->create([
                'target_user_id' => null,
                'content' => ['is_avatar_update' => true],
                'is_repost' => false
            ]);

            $post->attachments()->create([
                'type' => 'image', 'file_path' => $path, 'sort_order' => 0,
                'file_name' => basename($path), 'original_name' => $avatarFile->getClientOriginalName(),
                'file_size' => $avatarFile->getSize()
            ]);

            $targetUser->avatar = $path;
            $targetUser->avatar_post_id = $post->id;
        }

        if (!empty($data['finish_setup']) && $data['finish_setup']) $targetUser->is_setup_complete = true;

        if (!$targetUser->isDirty()) throw new ApiException('ERR_NOTHING_TO_UPDATE', 422);

        $targetUser->save();
    }

    public function updateEmail(User $user, string $email): void
    {
        $user->email = $email;
        $user->email_verified_at = null;
        $user->save();
        $user->sendEmailVerificationNotification();
    }

    public function updatePassword(User $user, string $password): void
    {
        $user->update(['password' => Hash::make($password)]);

        // відміняєм сесії після зміни пароля
        if ($user->currentAccessToken())
        {
            $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
        } else
        {
            $user->tokens()->delete();
        }
    }
}