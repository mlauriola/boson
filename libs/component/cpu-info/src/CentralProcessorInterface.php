<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo;

use Boson\Component\CpuInfo\Vendor\VendorInfoInterface;

interface CentralProcessorInterface extends VendorInfoInterface
{
    /**
     * Gets current CPU architecture type
     */
    public ArchitectureInterface $arch { get; }

    /**
     * Returns a list of supported processor instructions.
     *
     * @var iterable<array-key, InstructionSetInterface>
     */
    public iterable $instructionSets { get; }
}
