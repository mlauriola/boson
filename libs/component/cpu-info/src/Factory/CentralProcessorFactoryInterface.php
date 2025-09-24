<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory;

use Boson\Contracts\CpuInfo\CentralProcessorInterface;

interface CentralProcessorFactoryInterface
{
    public function createCentralProcessor(): CentralProcessorInterface;
}
