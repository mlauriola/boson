<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Component\CpuInfo\Vendor\VendorInfoInterface;

/**
 * Provides general CPU information provided by the CPU manufacturer.
 */
interface CentralProcessorVendorInfoProviderInterface extends
    VendorInfoInterface {}
