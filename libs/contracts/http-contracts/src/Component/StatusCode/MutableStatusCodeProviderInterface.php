<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\StatusCode;

use Boson\Contracts\Http\Component\StatusCodeInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InStatusCodeType from EvolvableStatusCodeProviderInterface
 * @phpstan-import-type OutStatusCodeType from StatusCodeProviderInterface
 *
 * @phpstan-type OutMutableStatusCodeType OutStatusCodeType
 */
interface MutableStatusCodeProviderInterface extends StatusCodeProviderInterface
{
    /**
     * Get behaviour similar to {@see StatusCodeProviderInterface::$status}.
     *
     * @var OutMutableStatusCodeType
     */
    public StatusCodeInterface $status {
        get;
        /**
         * Allows to set any integer status code value.
         *
         * @param InStatusCodeType $status
         *
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(StatusCodeInterface|int $status);
    }
}
