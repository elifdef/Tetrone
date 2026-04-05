<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');
        return $this->user()->can('comment', $post);
    }

    public function rules(): array
    {
        return [
            'content' => 'required|array'
        ];
    }
}