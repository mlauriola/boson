<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component;

/**
 * @phpstan-import-type HeaderInputNameType from HeadersInterface
 * @phpstan-import-type HeaderInputLineValueType from HeadersInterface
 * @phpstan-import-type HeaderInputValueType from HeadersInterface
 */
interface EvolvableHeadersInterface extends HeadersInterface
{
    /**
     * @param HeaderInputNameType $name
     * @param HeaderInputLineValueType $value
     */
    public function withAddedHeader(string|\Stringable $name, string|\Stringable $value): self;

    /**
     * @param HeaderInputNameType $name
     * @param HeaderInputValueType $values
     */
    public function withHeader(string|\Stringable $name, string|\Stringable|iterable $values): self;

    /**
     * @param HeaderInputNameType $name
     */
    public function withoutHeader(string|\Stringable $name): self;
}
