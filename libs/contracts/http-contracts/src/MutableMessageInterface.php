<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\MutableHeadersInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InHeadersType from EvolvableMessageInterface
 * @phpstan-import-type OutHeadersType from MessageInterface
 * @phpstan-type OutMutableHeadersType OutHeadersType&MutableHeadersInterface
 * @phpstan-import-type InBodyType from EvolvableMessageInterface
 * @phpstan-import-type OutBodyType from MessageInterface
 * @phpstan-type OutMutableBodyType OutBodyType
 */
interface MutableMessageInterface extends MessageInterface
{
    /**
     * @var OutMutableHeadersType
     */
    public MutableHeadersInterface $headers {
        get;
        /**
         * Allows to set any headers list, including immutable.
         *
         * @param InHeadersType $headers
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(iterable $headers);
    }

    /**
     * @var OutMutableBodyType
     */
    public string $body {
        get;
        /**
         * Allows to set any string or string-like body value.
         *
         * @param InBodyType $body
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(string|\Stringable $body);
    }
}
