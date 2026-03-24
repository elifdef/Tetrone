<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $validReasons = implode(',', config('reports.reasons'));

        return [
            'type' => 'required|in:post,user,comment,emoji_pack',
            'id' => 'required|string',
            'reason' => 'required|string|in:' . $validReasons,
            'details' => 'required|string|max:1000',
        ];
    }
}