<?php

namespace App\Http\Resources;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\PrivacyService;
use App\Enums\PrivacyContext;

class PublicUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currentUser = $request->user('sanctum');
        $status = $this->getFriendshipStatusWith($currentUser);
        $privacy = app(PrivacyService::class);

        $personalizationData = $this->personalization ? [
            'banner_image' => $this->personalization->banner_image ? asset("storage/" . $this->personalization->banner_image) : null,
            'banner_color' => $this->personalization->banner_color,
            'username_color' => $this->personalization->username_color,
        ] : null;

        if ($this->is_banned)
        {
            return $this->getRestrictedResponse($status, true);
        }

        if ($status === 'blocked_by_target')
        {
            return $this->getRestrictedResponse($status, (bool)$this->is_banned);
        }

        $canSeeProfile = $privacy->canAccess($this->resource, $currentUser, PrivacyContext::Profile->value);

        if (!$canSeeProfile)
        {
            $restricted = $this->getRestrictedResponse($status, (bool)$this->is_banned);
            $restricted['is_private'] = true;
            return $restricted;
        }

        $canSeeAvatar = $privacy->canAccess($this->resource, $currentUser, PrivacyContext::Avatar->value);
        $canSeeDob = $privacy->canAccess($this->resource, $currentUser, PrivacyContext::Dob->value);
        $canSeeCountry = $privacy->canAccess($this->resource, $currentUser, PrivacyContext::Country->value);

        return [
            'id' => $this->id,
            'username' => $this->username,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'avatar' => $canSeeAvatar ? $this->avatar : User::defaultAvatar,
            'bio' => $this->bio,
            'gender' => $this->gender,
            'created_at' => $this->created_at->toISOString(),
            'birth_date' => $canSeeDob ? $this->birth_date : null,
            'country' => $canSeeCountry ? $this->country : null,
            'is_online' => $this->is_online,
            'last_seen' => $this->last_seen_at,
            'is_setup_complete' => (bool)$this->is_setup_complete,
            'role' => $this->role,
            'friendship_status' => $status,
            'is_banned' => (bool)$this->is_banned,

            'friends_count' => $this->getAllFriendIds()->count(),
            'followers_count' => $this->receivedFriendships()->wherePivot('status', Friendship::STATUS_PENDING)->count(),
            'personalization' => $personalizationData,

            'is_private' => false,
            'permissions' => [
                'can_message' => $currentUser ? $currentUser->can('sendMessage', $this->resource) : false,
                'can_post_on_wall' => $currentUser ? $currentUser->can('writeOnWall', $this->resource) : false,
            ]
        ];
    }

    private function getRestrictedResponse($status, bool $isBanned): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'avatar' => User::defaultAvatar,
            'bio' => null,
            'gender' => null,
            'birth_date' => null,
            'created_at' => null,
            'is_online' => false,
            'last_seen' => null,
            'is_setup_complete' => true,
            'friendship_status' => $status,
            'country' => null,
            'is_banned' => $isBanned,
            'is_private' => false,
            'personalization' => null,
            'permissions' => [
                'can_message' => false,
                'can_post_on_wall' => false,
            ]
        ];
    }
}