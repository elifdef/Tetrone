<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ManageReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('report'));
    }

    public function rules(): array
    {
        return [
            'admin_response' => 'required|string|max:1000'
        ];
    }
}