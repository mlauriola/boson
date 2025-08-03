<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Url;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InUrlType string|\Stringable
 */
interface EvolvableUrlProviderInterface extends UrlProviderInterface
{
    /**
     * @param InUrlType $url
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withUrl(string|\Stringable $url): self;
}
