<?php

declare(strict_types=1);

namespace Boson\Contracts\CpuInfo\InstructionSet;

use Boson\Contracts\CpuInfo\InstructionSetInterface;

interface InstructionSetProviderInterface
{
    /**
     * Returns a list of supported processor instructions
     *
     * @var iterable<array-key, InstructionSetInterface>
     */
    public iterable $instructionSets { get; }
}
