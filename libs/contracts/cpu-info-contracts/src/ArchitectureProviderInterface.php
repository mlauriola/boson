<?php

declare(strict_types=1);

namespace Boson\Contracts\CpuInfo;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

interface ArchitectureProviderInterface
{
    /**
     * Gets current CPU architecture type
     */
    public ArchitectureInterface $arch { get; }
}
