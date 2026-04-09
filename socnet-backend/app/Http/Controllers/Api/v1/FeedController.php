<?php

namespace App\Http\Controllers\Api\v1;

use Illuminate\Http\Request;
use App\Http\Resources\PostResource;
use App\Services\FeedService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FeedController extends Controller
{
    public function __construct(protected FeedService $feedService)
    {
    }

    public function feed(Request $request): AnonymousResourceCollection
    {
        $posts = $this->feedService->getPersonalFeed($request->user());

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'FEED_RETRIEVED'
        ]);
    }

    public function globalFeed(Request $request): AnonymousResourceCollection
    {
        $posts = $this->feedService->getGlobalFeed($request->user('sanctum'));

        return PostResource::collection($posts)->additional([
            'success' => true,
            'code' => 'GLOBAL_FEED_RETRIEVED'
        ]);
    }
}