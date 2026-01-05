<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\PublicUserResource;
use App\Models\User;
class UserController extends Controller
{
    // вивести дані ВСІХ користувачів
    public function index()
    {
        //
    }

    // хм...
    public function store(StoreUserRequest $request)
    {
        //
    }

    // вивести дані КОНКРЕТНОГО користувача
    public function show(string $username)
    {
        $currentUser = User::where('username', $username)->firstOrFail();
        return new PublicUserResource($currentUser);
    }

    // обновити користувача (якщо він поміняв аватарку, ПІБ і т.д)
    public function update(StoreUserRequest $request, User $user)
    {
        //
    }

    // видалення користувача
    // бажано підтверджувати паролем
    public function destroy(User $user)
    {
        //
    }
}
