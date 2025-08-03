<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\MethodInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;
use Boson\Contracts\Uri\UriInterface;

/**
 * @phpstan-import-type InMethodType from EvolvableRequestInterface
 * @phpstan-import-type OutMethodType from RequestInterface
 * @phpstan-type OutMutableMethodType OutMethodType
 * @phpstan-import-type InUrlType from EvolvableRequestInterface
 * @phpstan-import-type OutUrlType from RequestInterface
 * @phpstan-type OutMutableUrlType OutUrlType
 */
interface MutableRequestInterface extends MutableMessageInterface, RequestInterface
{
    /**
     * Get behaviour similar to {@see RequestInterface::$method}.
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

    /**
     * Get behaviour similar to {@see RequestInterface::$url}.
     *
     * @var OutMutableUrlType
     */
    public UriInterface $url {
        get;
        /**
         * Also allows to set empty or non-normalized URL/URI string or object
         *
         * @param InUrlType $url
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(string|\Stringable $url);
    }
}
