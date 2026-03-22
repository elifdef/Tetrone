<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\Appeal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\v1\Controller;
use App\Models\User;

class AppealController extends Controller
{
    /**
     * отримати список апеляцій
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $stats = [
            'total' => Appeal::count(),
            'pending' => Appeal::where('status', 'pending')->count(),
            'approved' => Appeal::where('status', 'approved')->count(),
            'rejected' => Appeal::where('status', 'rejected')->count(),
        ];

        $query = Appeal::with(['user', 'moderator'])->latest();

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected']))
        {
            $query->where('status', $request->status);
        }

        $appeals = $query->paginate(20);

        return $this->success('APPEALS_RETRIEVED', 'Appeals retrieved', [
            'stats' => $stats,
            'appeals' => $appeals
        ]);
    }

    /**
     * схвалити апеляцію
     */
    public function resolve(Request $request, Appeal $appeal): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $user = $appeal->user;
        if ($user)
        {
            $user->is_banned = false;
            $user->save();
        }

        $appeal->update([
            'status' => 'approved',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        return $this->success('APPEAL_APPROVED', 'Appeal approved. User unlocked.');
    }

    /**
     * відхилити апеляцію
     */
    public function reject(Request $request, Appeal $appeal): JsonResponse
    {
        $this->authorize('viewAdminPanel', User::class);

        $request->validate(['admin_response' => 'required|string|max:1000']);

        $appeal->update([
            'status' => 'rejected',
            'moderator_id' => $request->user()->id,
            'admin_response' => $request->admin_response
        ]);

        return $this->success('APPEAL_REJECTED', 'Appeal dismissed. Ban remains in force.');
    }
}
