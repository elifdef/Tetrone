<?php

namespace App\Traits;

trait SanitizesProseMirror
{
    protected array $allowedFontSizes = ['11px', '12px', '14px', '16px', '18px', '20px', '24px'];

    protected function sanitizeProseMirrorNode(array $node): array
    {
        if (isset($node['marks']) && is_array($node['marks']))
        {
            $sanitizedMarks = [];
            foreach ($node['marks'] as $mark)
            {
                if (isset($mark['type']) && $mark['type'] === 'textStyle')
                {
                    $fontSize = $mark['attrs']['fontSize'] ?? null;

                    if ($fontSize && !in_array($fontSize, $this->allowedFontSizes, true))
                    {
                        unset($mark['attrs']['fontSize']);
                    }
                }
                $sanitizedMarks[] = $mark;
            }
            $node['marks'] = $sanitizedMarks;
        }

        if (isset($node['content']) && is_array($node['content']))
        {
            $sanitizedContent = [];
            foreach ($node['content'] as $child)
            {
                if (is_array($child))
                {
                    $sanitizedContent[] = $this->sanitizeProseMirrorNode($child);
                } else
                {
                    $sanitizedContent[] = $child;
                }
            }
            $node['content'] = $sanitizedContent;
        }

        return $node;
    }
}