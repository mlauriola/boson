<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\HeadersInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InHeadersListType from HeadersInterface
 *
 * @phpstan-type InHeadersType InHeadersListType
 * @phpstan-type InBodyType string|\Stringable
 */
interface EvolvableMessageInterface extends MessageInterface
{
    /**
     * @param InHeadersType $headers
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withHeaders(iterable $headers): self;

    /**
     * @param InBodyType $body
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withBody(string|\Stringable $body): self;
}
