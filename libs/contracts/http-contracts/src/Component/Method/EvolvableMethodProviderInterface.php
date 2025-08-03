<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Method;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InMethodType non-empty-string|\Stringable
 */
interface EvolvableMethodProviderInterface extends MethodProviderInterface
{
    /**
     * @param InMethodType $method
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withMethod(string|\Stringable $method): self;
}
