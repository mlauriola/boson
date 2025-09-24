<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;
use Boson\Contracts\CpuInfo\InstructionSetInterface;

interface InstructionSetsDriverInterface
{
    /**
     * @return iterable<array-key, InstructionSetInterface>|null
     */
    public function tryGetInstructionSets(ArchitectureInterface $arch): ?iterable;
}