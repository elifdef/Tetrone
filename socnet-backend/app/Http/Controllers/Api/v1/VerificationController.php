<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;

class VerificationController extends Controller
{
    public function verify(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Перевірка підпису
        if (!$request->hasValidSignature())
        {
            return $this->error('ERR_INVALID_SIGNATURE', 'The link is invalid or expired.', 403);
        }

        // Якщо вже підтверджено
        if ($user->hasVerifiedEmail())
        {
            return $this->success('EMAIL_VERIFIED_ALREADY', 'The mail has already been verified.');
        }

        // Підтвердження
        if ($user->markEmailAsVerified())
        {
            event(new Verified($user));
        }

        return $this->success('EMAIL_VERIFIED', 'Email successfully confirmed!');
    }
}