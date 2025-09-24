<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver;

use Boson\Component\CpuInfo\Architecture;
use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

abstract readonly class AMD64Detector implements DetectorInterface
{
    public function isSupported(ArchitectureInterface $arch): bool
    {
        return $arch->is(Architecture::Amd64);
    }
}
