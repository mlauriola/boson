<?php

declare(strict_types=1);

namespace Boson\Api\Alert;

interface AlertApiInterface
{
    public function create(AlertCreateInfo $info): ?AlertButton;
}
