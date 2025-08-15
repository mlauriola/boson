<?php

declare(strict_types=1);

namespace Boson\Contracts\OsInfo\Family;

use Boson\Contracts\OsInfo\FamilyInterface;

interface FamilyProviderInterface
{
    /**
     * Gets the family this operating system belongs to.
     */
    public FamilyInterface $family { get; }
}
