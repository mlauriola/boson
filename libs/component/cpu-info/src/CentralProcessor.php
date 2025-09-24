<?php

declare(strict_types=1);

namespace Boson\Component\CpuInfo;

use Boson\Component\CpuInfo\Factory\DefaultCentralProcessorFactory;
use Boson\Component\CpuInfo\Factory\InMemoryCentralProcessorFactory;
use Boson\Contracts\CpuInfo\Architecture\ArchitectureInterface;
use Boson\Contracts\CpuInfo\CentralProcessorInterface;
use Boson\Contracts\CpuInfo\InstructionSetInterface;

final readonly class CentralProcessor implements CentralProcessorInterface
{
    /**
     * @var list<InstructionSetInterface>
     */
    public array $instructionSets;

    /**
     * @param iterable<mixed, InstructionSetInterface> $instructionSets
     */
    public function __construct(
        public ArchitectureInterface $arch,
        /**
         * @var non-empty-string
         */
        public string $vendor,
        /**
         * @var non-empty-string|null
         */
        public ?string $name = null,
        /**
         * @var int<1, max>
         */
        public int $cores = 1,
        /**
         * @var int<1, max>
         */
        public int $threads = 1,
        iterable $instructionSets = [],
    ) {
        $this->instructionSets = \iterator_to_array($instructionSets, false);
    }

    /**
     * Checks if this CPU supports the given instruction set.
     *
     * @api
     */
    public function isSupports(InstructionSetInterface $instructionSet): bool
    {
        return \in_array($instructionSet, $this->instructionSets, true);
    }

    /**
     * @api
     */
    public static function createFromGlobals(): CentralProcessorInterface
    {
        /** @phpstan-var InMemoryCentralProcessorFactory $factory */
        static $factory = new InMemoryCentralProcessorFactory(
            delegate: new DefaultCentralProcessorFactory(),
        );

        return $factory->createCentralProcessor();
    }
}
