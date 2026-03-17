<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Resources\PublicUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use App\Services\FileStorageService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    protected $fileService;

    public function __construct(FileStorageService $fileService)
    {
        $this->fileService = $fileService;
    }

    /**
     * Вивід базових данних ВСІХ користувачів
     * З пагінацією 20 юзерів на сторінку
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->input('search');
        $query = User::query();

        // Виключаємо себе зі списку
        if ($request->user())
        {
            $query->where('id', '!=', $request->user()->id);
        }

        // Якщо користувач щось ввів у пошук
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
            // Якщо пошуку немає - показуємо найновіших
            $query->latest();
        }

        // поверне лише 20 записів + метадані про сторінки
        $users = $query->paginate(20);

        return PublicUserResource::collection($users);
    }

    // хм...
    public function store(Request $request)
    {
        //
    }

    /**
     * вивести дані КОНКРЕТНОГО користувача
     *
     * @param string $username
     * @return array
     */
    public function show(string $username): array
    {
        $currentUser = User::where('username', $username)->firstOrFail();

        return (new PublicUserResource($currentUser))->resolve();
    }

    /**
     * обновити користувача (якщо він поміняв аватарку, ПІБ і т.д)
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function update(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();

        if ($request->user()->id !== $targetUser->id)
        {
            return $this->error('ERR_ACCESS_DENIED', 'Access denied.', 403);
        }

        $rules = [
            'bio' => 'nullable|string|max:1000',
            'last_name' => 'nullable|string|min:3|max:50',
            'avatar' => 'nullable|image|max:' . config('uploads.max_size'),
            'country' => 'nullable|string|size:2|alpha',
            'gender' => 'nullable|integer|in:1,2'
        ];

        if ($request->has('finish_setup') && $request->input('finish_setup'))
        {
            $rules['first_name'] = 'required|string|min:3|max:50';
            $rules['birth_date'] = 'required|date';
        } else
        {
            $rules['first_name'] = 'nullable|string|min:3|max:50';
            $rules['birth_date'] = 'nullable|date';
        }

        $validated = $request->validate($rules);

        $targetUser->fill(collect($validated)->except(['avatar'])->toArray());

        if ($request->hasFile('avatar'))
        {
            $file = $request->file('avatar');
            $path = $this->fileService->upload(
                file: $file,
                folder: $targetUser->username,
                prefix: 'avatar'
            );

            $targetUser->avatar = $path;

            // створюємо пост про оновлення аватарки
            $post = $targetUser->posts()->create([
                'target_user_id' => null,
                'content' => null,
                'entities' => ['is_avatar_update' => true],
                'is_repost' => false
            ]);

            $post->attachments()->create([
                'type' => 'image',
                'file_path' => $path,
                'sort_order' => 0,
                'file_name' => basename($path),
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize()
            ]);

            $targetUser->avatar_post_id = $post->id;
        }

        if ($request->has('finish_setup') && $request->input('finish_setup'))
        {
            $targetUser->is_setup_complete = true;
        }

        if (!$targetUser->isDirty())
        {
            return $this->error('ERR_NOTHING_TO_UPDATE', 'Nothing to update', 418);
        }

        $targetUser->save();

        return $this->success('PROFILE_UPDATED', 'Profile updated successfully');
    }

    /**
     * оновлення пошти
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', Rule::unique('users')->ignore($request->user()->id)],
            'password' => ['required'], // пароль для підтвердження
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password))
        {
            return $this->error('ERR_INVALID_PASSWORD', 'Invalid password', 422);
        }

        // обнуляєм верифікацію для старої пошти
        $user->email = $request->email;
        $user->email_verified_at = null;
        $user->save();

        $user->sendEmailVerificationNotification();

        return $this->success('EMAIL_UPDATED', 'Email changed. Please confirm your new address.');
    }

    /**
     * оновлення пароля
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols()
            ],
        ]);

        $request->user()->update(['password' => Hash::make($validated['password'])]);

        return $this->success('PASSWORD_UPDATED', 'Password has been changed.');
    }
}