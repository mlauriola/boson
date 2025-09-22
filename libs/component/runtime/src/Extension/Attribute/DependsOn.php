<?php

declare(strict_types=1);

namespace Boson\Extension\Attribute;

use Boson\Extension\ExtensionInterface;

/**
 * @phpstan-import-type DependencyType from ExtensionInterface
 */
#[\Attribute(\Attribute::TARGET_CLASS | \Attribute::IS_REPEATABLE)]
final readonly class DependsOn
{
    /**
     * @var list<DependencyType>
     */
    public array $dependencies;

    /**
     * @param DependencyType|iterable<mixed, DependencyType> $provider
     */
    public function __construct(
        string|iterable $provider,
    ) {
        $this->dependencies = match (true) {
            \is_string($provider) => [$provider],
            \is_array($provider) => \array_values($provider),
            default => \iterator_to_array($provider, false),
        };
    }
}
