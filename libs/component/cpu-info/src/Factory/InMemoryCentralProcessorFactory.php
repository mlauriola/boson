<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory;

use Boson\Contracts\CpuInfo\CentralProcessorInterface;

final class InMemoryCentralProcessorFactory implements CentralProcessorFactoryInterface
{
    private ?CentralProcessorInterface $cpu = null;

    public function __construct(
        private readonly CentralProcessorFactoryInterface $delegate,
    ) {}

    public function createCentralProcessor(): CentralProcessorInterface
    {
        return $this->cpu ??= $this->delegate->createCentralProcessor();
    }
}
