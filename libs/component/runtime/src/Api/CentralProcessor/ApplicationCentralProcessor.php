<?php

declare(strict_types=1);

namespace Boson\Api\CentralProcessor;

use Boson\Api\ApplicationExtension;
use Boson\Api\CentralProcessorApiInterface;
use Boson\Component\CpuInfo\ArchitectureInterface;
use Boson\Component\CpuInfo\CentralProcessor;

final class ApplicationCentralProcessor extends ApplicationExtension implements
    CentralProcessorApiInterface
{
    private CentralProcessor $cpu {
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

    public int $physicalCores {
        get => $this->cpu->physicalCores;
    }

    public int $logicalCores {
        get => $this->cpu->logicalCores;
    }

    public iterable $instructionSets {
        get => $this->cpu->instructionSets;
    }
}
