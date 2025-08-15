<?php

declare(strict_types=1);

namespace Boson\Contracts\OsInfo\Standard;

use Boson\Contracts\OsInfo\StandardInterface;

interface StandardsProviderInterface
{
    /**
     * Gets the list of standards supported by this operating system.
     *
     * @var iterable<array-key, StandardInterface>
     */
    public iterable $standards { get; }

    /**
     * Checks if this operating system supports the given standard.
     *
     * This method checks if any of the standards supported by this operating
     * system (including standards of its family) supports the given standard.
     *
     * @api
     */
    public function isSupports(StandardInterface $standard): bool;
}
