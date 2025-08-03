<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Headers;

use Boson\Contracts\Http\Component\HeadersInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-import-type InHeadersListType from HeadersInterface
 *
 * @phpstan-type InHeadersType InHeadersListType
 */
interface EvolvableHeadersProviderInterface extends HeadersProviderInterface
{
    /**
     * @param InHeadersType $headers
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withHeaders(iterable $headers): self;
}
