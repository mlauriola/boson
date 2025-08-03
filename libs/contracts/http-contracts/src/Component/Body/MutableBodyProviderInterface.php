<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Body;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InBodyType from EvolvableBodyProviderInterface
 * @phpstan-import-type OutBodyType from BodyProviderInterface
 *
 * @phpstan-type OutMutableBodyType OutBodyType
 */
interface MutableBodyProviderInterface extends BodyProviderInterface
{
    /**
     * Get behaviour similar to {@see BodyProviderInterface::$body}.
     *
     * @var OutMutableBodyType
     */
    public string $body {
        get;
        /**
         * Allows to set any string or string-like body value.
         *
         * @param InBodyType $body
         *
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(string|\Stringable $body);
    }
}
