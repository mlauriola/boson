<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\StatusCodeInterface;

/**
 * @phpstan-type OutStatusCodeType StatusCodeInterface
 */
interface ResponseInterface extends MessageInterface
{
    /**
     * Gets status code integer value of the HTTP Response instance.
     *
     * @var OutStatusCodeType
     */
    public StatusCodeInterface $status {
        get;
    }
}
