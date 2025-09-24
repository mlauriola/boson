<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo\Factory\Driver;

use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\AESDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\AVX2Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\AVX512FDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\AVXDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\DetectorInterface;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\EM64TDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\F16CDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\FMA3Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\MMXDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\POPCNTDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSE2Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSE3Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSE41Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSE42Detector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSEDetector;
use Boson\Component\CpuInfo\Factory\Driver\CpuIdDriver\SSSE3Detector;
use Boson\Component\Pasm\Executor;
use Boson\Component\Pasm\ExecutorInterface;
use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;

final readonly class CpuIdDriver implements InstructionSetsDriverInterface
{
    public function __construct(
        private ExecutorInterface $executor = new Executor(),
    ) {}

    /**
     * @return list<DetectorInterface>
     */
    private function getDetectors(): array
    {
        return [
            new MMXDetector(),
            new SSEDetector(),
            new SSE2Detector(),
            new SSE3Detector(),
            new SSSE3Detector(),
            new SSE41Detector(),
            new SSE42Detector(),
            new FMA3Detector(),
            new AVXDetector(),
            new AVX2Detector(),
            new AVX512FDetector(),
            new AESDetector(),
            new EM64TDetector(),
            new POPCNTDetector(),
            new F16CDetector(),
        ];
    }

    public function tryGetInstructionSets(ArchitectureInterface $arch): ?iterable
    {
        $result = [];

        foreach ($this->getDetectors() as $detector) {
            if ($detector->isSupported($arch)) {
                $instructionSet = $detector->detect($this->executor);

                if ($instructionSet !== null) {
                    $result[] = $instructionSet;
                }
            }
        }

        if ($result === []) {
            return null;
        }

        return $result;
    }
}