<?php

declare(strict_types=1);

namespace Boson\Contracts\Http;

use Boson\Contracts\Http\Component\StatusCodeInterface;
use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;

/**
 * @phpstan-type InStatusCodeType int|StatusCodeInterface
 */
interface EvolvableResponseInterface extends ResponseInterface, EvolvableMessageInterface
{
    /**
     * @param InStatusCodeType $status
     *
     * @throws InvalidComponentArgumentExceptionInterface
     */
    public function withStatus(StatusCodeInterface|int $status): self;
}
