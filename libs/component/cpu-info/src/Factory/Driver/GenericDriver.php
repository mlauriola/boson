<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver;

use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

/**
 * Returns general (and imprecise) CPU information
 */
final readonly class GenericDriver implements VendorDriverInterface
{
    public function tryGetVendor(ArchitectureInterface $arch): string
    {
        return \php_uname('m');
    }
}
