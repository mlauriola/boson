<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Architecture\Factory;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

interface ArchitectureFactoryInterface
{
    public function createArchitecture(): ArchitectureInterface;
}
