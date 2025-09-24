<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

interface VendorDriverInterface
{
    /**
     * @return non-empty-string|null
     */
    public function tryGetVendor(ArchitectureInterface $arch): ?string;
}
