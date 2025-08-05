<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Component\CpuInfo\Architecture\ArchitectureProviderInterface;

/**
 * Provides advanced detailed CPU information.
 *
 * For example:
 *  - List of supported instruction sets
 *  - etc...
 */
interface AdvancedCpuInfoProviderInterface extends
    ArchitectureProviderInterface {}
