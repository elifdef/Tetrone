<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait ExtractsPostContent
{
    /**
     * Універсальний метод отримання прев'ю тексту з поста
     */
    protected function getPostSnippet(?array $content, int $limit = 60): ?string
    {
        if (!$content)
        {
            return null;
        }

        // 1. Рекурсивно витягуємо текст, стікери та згадки
        $text = trim($this->parseTipTapNode($content));

        if (!empty($text))
        {
            return Str::limit($text, $limit);
        }

        // 2. Фолбеки, якщо це просто медіа або опитування
        if (isset($content['poll'])) return 'POLL';
        if (isset($content['youtube']) || (isset($content['attachments']) && count($content['attachments']) > 0)) return 'ATTACHMENT';
        if (!empty($content['is_avatar_update'])) return 'AVATAR_UPDATE';

        return null;
    }

    private function parseTipTapNode($node): string
    {
        if (is_string($node)) return strip_tags($node);
        if (!is_array($node)) return '';

        $text = '';

        if (isset($node['type']))
        {
            if ($node['type'] === 'text')
            {
                return $node['text'] ?? '';
            }
            if ($node['type'] === 'customSticker')
            {
                return '[' . ($node['attrs']['shortcode'] ?? 'sticker') . '] ';
            }
            if ($node['type'] === 'mention')
            {
                return '@' . ($node['attrs']['username'] ?? $node['attrs']['id'] ?? 'user') . ' ';
            }
            if ($node['type'] === 'paragraph')
            {
                $text .= ' ';
            }
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            foreach ($node['content'] as $child)
            {
                $text .= $this->parseTipTapNode($child);
            }
        }

        return $text;
    }
}