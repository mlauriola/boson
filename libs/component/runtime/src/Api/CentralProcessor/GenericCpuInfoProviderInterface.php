<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Component\CpuInfo\Architecture\ArchitectureProviderInterface;

/**
 * Provides generic CPU information.
 *
 * For example:
 * - A common CPU family
 * - etc...
 */
interface GenericCpuInfoProviderInterface extends
    ArchitectureProviderInterface {}
