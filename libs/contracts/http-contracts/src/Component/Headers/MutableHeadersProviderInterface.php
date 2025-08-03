<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Headers;

use Boson\Contracts\Http\Component\MutableHeadersInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InHeadersType from EvolvableHeadersProviderInterface
 * @phpstan-import-type OutHeadersType from HeadersProviderInterface
 *
 * @phpstan-type OutMutableHeadersType OutHeadersType&MutableHeadersInterface
 */
interface MutableHeadersProviderInterface extends HeadersProviderInterface
{
    /**
     * Get behaviour similar to {@see HeadersProviderInterface::$headers}, but
     * returns mutable headers list instance instead of immutable.
     *
     * @var OutMutableHeadersType
     */
    public MutableHeadersInterface $headers {
        get;
        /**
         * Allows to set any headers list, including immutable.
         *
         * @param InHeadersType $headers
         *
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(iterable $headers);
    }
}
