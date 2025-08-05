<?php

declare(strict_types=1);

namespace Boson\Api;

use Boson\Api\CentralProcessor\CentralProcessorInfoProviderInterface;
use Boson\Api\CentralProcessor\CentralProcessorVendorInfoProviderInterface;

/**
 * Provides information about the main CPU.
 */
interface CentralProcessorApiInterface extends
    CentralProcessorVendorInfoProviderInterface,
    CentralProcessorInfoProviderInterface {}
