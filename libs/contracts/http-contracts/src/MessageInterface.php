<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\HeadersInterface;

/**
 * @phpstan-type OutHeadersType HeadersInterface
 * @phpstan-type OutBodyType string
 */
interface MessageInterface
{
    /**
     * Gets immutable HTTP headers list of the HTTP Message instance.
     *
     * @link https://datatracker.ietf.org/doc/html/rfc4229
     *
     * @var OutHeadersType
     */
    public HeadersInterface $headers {
        get;
    }

    /**
     * Gets body content string of the HTTP Message instance.
     *
     * @var OutBodyType
     */
    public string $body {
        get;
    }
}
