<?php

namespace App\Http\Requests\Support;

use App\Enums\TicketCategory;
use App\Enums\TicketSubcategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['required', Rule::enum(TicketCategory::class)],
            'subcategory' => ['required_if:category,bug_report', Rule::enum(TicketSubcategory::class), 'nullable'],
            'subject' => 'required|string|max:150',
            'message' => 'required|string|min:10',

            'meta' => 'nullable|array|max:5',
            'meta.browser' => 'nullable|string|max:100',
            'meta.os' => 'nullable|string|max:100',
            'meta.steps_to_reproduce' => 'required_if:category,bug_report|string|max:2000|nullable',

            'attachments' => 'required_if:category,bug_report|array|max:5',
            'attachments.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ];
    }
}