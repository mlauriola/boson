<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\StatusCode;

use Boson\Contracts\Http\Component\StatusCodeInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InStatusCodeType int|StatusCodeInterface
 */
interface EvolvableStatusCodeProviderInterface extends StatusCodeProviderInterface
{
    /**
     * Allows to set any integer status code value.
     *
     * @param InStatusCodeType $status
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withStatus(StatusCodeInterface|int $status): self;
}
