<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Body;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InBodyType string|\Stringable
 */
interface EvolvableBodyProviderInterface extends BodyProviderInterface
{
    /**
     * @param InBodyType $body
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withBody(string|\Stringable $body): self;
}
