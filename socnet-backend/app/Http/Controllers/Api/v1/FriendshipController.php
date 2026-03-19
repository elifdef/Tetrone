<?php

namespace App\Http\Controllers\Api\v1;

use App\Events\UserBlockedEvent;
use App\Http\Resources\PublicUserResource;
use App\Models\Friendship;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FriendshipController extends Controller
{
    /**
     * надсилання заявки в друзі
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function sendRequest(Request $request, string $username): JsonResponse
    {
        // для розуміння:
        // А - користувач 1
        // В - користувач 2
        $targetUser = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        // Перевірка пошти
        if (!$me->hasVerifiedEmail())
        {
            return $this->error('ERR_EMAIL_UNVERIFIED', 'Email not confirmed.', 403);
        }

        // якщо кинув заявку сам собі
        if ($me->id === $targetUser->id)
        {
            return $this->error('ERR_CANNOT_FRIEND_SELF', 'You cannot friend yourself XD', 400);
        }

        // перевірка чи вже є якісь відносини між А і В або навпаки
        $existing = Friendship::between($me, $targetUser)->first();

        if ($existing)
        {
            // якщо А і В уже друзі
            if ($existing->status == Friendship::STATUS_ACCEPTED)
            {
                return $this->error('ERR_ALREADY_FRIENDS', 'Already friends', 409);
            }

            // якщо уже є заявка або від А або від В
            if ($existing->status == Friendship::STATUS_PENDING)
            {
                return $this->error('ERR_REQUEST_PENDING', 'Request already pending', 409);
            }

            // якщо А заблокував В або навпаки
            if ($existing->status == Friendship::STATUS_BLOCKED)
            {
                return $this->error('ERR_USER_BLOCKED', 'Unable to send request', 403);
            }
        }

        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_PENDING
        ]);

        $targetUser->notify(new NewFriendRequestNotification($me));

        return $this->success('FRIEND_REQUEST_SENT', 'Friend request sent');
    }

    /**
     * приймання заявки в друзі
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function acceptRequest(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        // Шукаємо заявку де User_id == ТОЙ ХТО ПРОСИТЬ а Friend_id == Я
        $friendship = Friendship::where('user_id', $targetUser->id)
            ->where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->first();

        if (!$friendship)
        {
            return $this->error('ERR_NO_PENDING_REQUEST', 'No pending request found', 404);
        }

        $friendship->update(['status' => Friendship::STATUS_ACCEPTED]);

        return $this->success('FRIEND_REQUEST_ACCEPTED', 'Friend request accepted');
    }

    /**
     * видалення заявки або видалення з друзів
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function destroy(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        Friendship::between($request->user(), $targetUser)->delete();

        return $this->success('FRIEND_REMOVED', 'Relationship removed');
    }

    /**
     * блокування користувача
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function block(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        if ($me->id === $targetUser->id)
        {
            return $this->error('ERR_CANNOT_BLOCK_SELF', 'Cannot block yourself 1000-7', 400);
        }

        // видаляємо будь-які старі відносини (дружбу або заявки)
        Friendship::between($me, $targetUser)->delete();

        // новий запис про блокування, де ініціатор - Я
        Friendship::create([
            'user_id' => $me->id,
            'friend_id' => $targetUser->id,
            'status' => Friendship::STATUS_BLOCKED
        ]);

        broadcast(new UserBlockedEvent($me->id, $targetUser->id));

        return $this->success('USER_BLOCKED', 'User blocked');
    }

    /**
     * отримання списку друзів
     * (Колекції ресурсів залишаємо як є, fetchClient сам дістане res.data)
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function listFriends(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $friendIds = $me->getAllFriendIds();
        $friends = User::whereIn('id', $friendIds)->get();

        return PublicUserResource::collection($friends);
    }

    /**
     * для підрахунку кількості заявок у друзі
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getCounts(Request $request): JsonResponse
    {
        $me = $request->user();
        $requestsCount = Friendship::where('friend_id', $me->id)
            ->where('status', Friendship::STATUS_PENDING)
            ->count();

        // Загортаємо в success, щоб фронт отримав дані у res.data.requests_count
        return $this->success('SUCCESS', 'Counts retrieved', ['requests_count' => $requestsCount]);
    }

    /**
     * для отримання моїх підписок
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function sentRequests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->get();

        return PublicUserResource::collection($users);
    }

    /**
     * для отримання списку користувачів які НАМ кинули заявку в др
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function requests(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('sentFriendships', function ($q) use ($me)
        {
            $q->where('friend_id', $me->id)->where('status', Friendship::STATUS_PENDING);
        })->get();

        return PublicUserResource::collection($users);
    }

    /**
     * для отримання списку користувачів які у нас в ЧС
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function blocked(Request $request): AnonymousResourceCollection
    {
        $me = $request->user();
        $users = User::whereHas('receivedFriendships', function ($q) use ($me)
        {
            $q->where('user_id', $me->id)->where('status', Friendship::STATUS_BLOCKED);
        })->get();

        return PublicUserResource::collection($users);
    }

    /**
     * для видалення з ЧС
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function unblock(Request $request, string $username): JsonResponse
    {
        $targetUser = User::where('username', $username)->firstOrFail();
        $me = $request->user();

        // Видаляємо ТІЛЬКИ якщо Я заблокував (user_id == me)
        $deleted = Friendship::where('user_id', $me->id)
            ->where('friend_id', $targetUser->id)
            ->where('status', Friendship::STATUS_BLOCKED)
            ->delete();

        if ($deleted)
        {
            return $this->success('USER_UNBLOCKED', 'User unblocked');
        }

        return $this->error('ERR_NOT_IN_BLACKLIST', 'User was not in blacklist', 404);
    }
}