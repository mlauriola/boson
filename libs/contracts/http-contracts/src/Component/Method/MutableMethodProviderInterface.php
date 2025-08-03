<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Method;

use Boson\Contracts\Http\Component\MethodInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InMethodType from EvolvableMethodProviderInterface
 * @phpstan-import-type OutMethodType from MethodProviderInterface
 * @phpstan-type OutMutableMethodType OutMethodType
 */
interface MutableMethodProviderInterface extends MethodProviderInterface
{
    /**
     * Get behaviour similar to {@see MethodProviderInterface::$method}.
     *
     * @var OutMutableMethodType
     */
    public MethodInterface $method {
        get;
        /**
         * Also allows to set empty or non-normalized method name
         * string or object.
         *
         * @param InMethodType $method
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(string|\Stringable $method);
    }
}
