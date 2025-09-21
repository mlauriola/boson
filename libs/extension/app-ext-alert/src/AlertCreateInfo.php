<?php

declare(strict_types=1);

namespace Boson\Api\Alert;

final readonly class AlertCreateInfo
{
    public function __construct(
        public string $title = '',
        public string $text = '',
        public bool $cancel = false,
        public ?AlertIcon $icon = null,
    ) {}
}
