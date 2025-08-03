<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\StatusCodeInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InStatusCodeType from EvolvableResponseInterface
 * @phpstan-import-type OutStatusCodeType from ResponseInterface
 * @phpstan-type OutMutableStatusCodeType OutStatusCodeType
 */
interface MutableResponseInterface extends MutableMessageInterface, ResponseInterface
{
    /**
     * Get behaviour similar to {@see ResponseInterface::$status}.
     *
     * @var OutMutableStatusCodeType
     */
    public StatusCodeInterface $status {
        get;
        /**
         * Allows to set any integer status code value.
         *
         * @param InStatusCodeType $status
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(StatusCodeInterface|int $status);
    }
}
