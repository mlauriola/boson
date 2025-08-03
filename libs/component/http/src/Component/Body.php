<?php

declare(strict_types=1);

namespace Boson\Component\Http\Component;

use Boson\Component\Http\Exception\InvalidBodyException;
use Boson\Contracts\Http\EvolvableMessageInterface;
use Boson\Contracts\Http\MessageInterface;
use Boson\Contracts\Http\MutableMessageInterface;

/**
 * @phpstan-import-type OutBodyType from MessageInterface
 * @phpstan-import-type InBodyType from EvolvableMessageInterface
 * @phpstan-import-type InMutableBodyType from MutableMessageInterface
 */
final readonly class Body
{
    private function __construct() {}

    /**
     * @param InBodyType $body
     * @return OutBodyType
     * @throws InvalidBodyException
     */
    public static function create(string|\Stringable $body): string
    {
        if ($body instanceof \Stringable) {
            try {
                $scalar = (string) $body;
            } catch (\Throwable $e) {
                throw InvalidBodyException::becauseStringCastingErrorOccurs($body, $e);
            }

            $body = $scalar;
        }

        return $body;
    }

    /**
     * @param InBodyType $body
     * @return OutMutableBodyType
     * @throws InvalidBodyException
     */
    public static function createMutable(string|\Stringable $body): string
    {
        // Mutable HTTP body is similar to immutable
        return self::create($body);
    }
}
