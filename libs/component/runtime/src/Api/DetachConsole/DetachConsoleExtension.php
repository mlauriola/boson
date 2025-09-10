<?php

declare(strict_types=1);

namespace Boson\Api\DetachConsole;

abstract readonly class DetachConsoleExtension
{
    abstract public function detach(): void;
}
