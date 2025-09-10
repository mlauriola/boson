<?php

declare(strict_types=1);

namespace Boson\Api\DetachConsole;

use Boson\Api\DetachConsole\Windows\Kernel32;

final readonly class WindowsDetachConsoleExtension extends DetachConsoleExtension
{
    public function __construct(
        private Kernel32 $kernel32 = new Kernel32(),
    ) {}

    public function detach(): void
    {
        $this->kernel32->FreeConsole();
    }
}

__halt_compiler();

bool FreeConsole(void);
