<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Architecture;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

/**
 * @internal this is an internal library class, please do not use it in your code
 * @psalm-internal Boson\Component\CpuInfo\Architecture
 */
final class BuiltinArchitecture implements ArchitectureInterface
{
    use ArchitectureImpl;
}
