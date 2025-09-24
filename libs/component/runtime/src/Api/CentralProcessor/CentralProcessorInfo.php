<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Component\CpuInfo\CentralProcessor;
use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;
use Boson\Contracts\CpuInfo\CentralProcessorInterface;

/**
 * @internal this is an internal library class, please do not use it in your code
 * @psalm-internal Boson\Api\CentralProcessor
 */
final class CentralProcessorInfo implements CentralProcessorInfoInterface
{
    private CentralProcessorInterface $cpu {
        get => $this->cpu ??= CentralProcessor::createFromGlobals();
    }

    public ArchitectureInterface $arch {
        get => $this->cpu->arch;
    }

    public string $name {
        get => $this->cpu->name;
    }

    public ?string $vendor {
        get => $this->cpu->vendor;
    }

    public int $cores {
        get => $this->cpu->cores;
    }

    public int $threads {
        get => $this->cpu->threads;
    }

    public iterable $instructionSets {
        get => $this->cpu->instructionSets;
    }
}
