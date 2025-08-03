<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\MethodInterface;
use Boson\Contracts\Uri\UriInterface;

/**
 * @phpstan-type OutMethodType MethodInterface
 * @phpstan-type OutUrlType UriInterface
 */
interface RequestInterface extends MessageInterface
{
    /**
     * Gets HTTP method of the HTTP Request instance.
     *
     * @link https://httpwg.org/specs/rfc9110.html#method.definitions
     *
     * @var OutMethodType
     */
    public MethodInterface $method {
        get;
    }

    /**
     * Gets URI string of the HTTP Request instance.
     *
     * @var OutUrlType
     */
    public UriInterface $url {
        get;
    }
}
