<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Component\CpuInfo\CentralProcessorInterface;

/**
 * Provides extended CPU information as determined by external subsystems.
 */
interface CentralProcessorInfoProviderInterface extends
    CentralProcessorInterface {}
