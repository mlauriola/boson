<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InMethodType non-empty-string|\Stringable
 * @phpstan-type InUrlType string|\Stringable
 */
interface EvolvableRequestInterface extends RequestInterface, EvolvableMessageInterface
{
    /**
     * @param InMethodType $method
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withMethod(string|\Stringable $method): self;

    /**
     * @param InUrlType $url
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withUrl(string|\Stringable $url): self;
}
