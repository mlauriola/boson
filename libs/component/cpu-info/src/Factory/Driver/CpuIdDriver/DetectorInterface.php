<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver;

use Boson\Component\Pasm\ExecutorInterface;
use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;
use Boson\Contracts\CpuInfo\InstructionSetInterface;

interface DetectorInterface
{
    public function isSupported(ArchitectureInterface $arch): bool;

    public function detect(ExecutorInterface $executor): ?InstructionSetInterface;
}
