<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component;

/**
 * @phpstan-type HeaderInputNameType non-empty-string|\Stringable
 * @phpstan-type HeaderOutputNameType non-empty-lowercase-string
 *
 * @phpstan-type HeaderInputLineValueType string|\Stringable
 * @phpstan-type HeaderOutputLineValueType string
 *
 * @phpstan-type HeaderInputValueType HeaderInputLineValueType|iterable<mixed, HeaderInputLineValueType>
 * @phpstan-type HeaderOutputValueType list<HeaderOutputLineValueType>
 *
 * @phpstan-type HeadersListInputType iterable<HeaderInputNameType, HeaderInputValueType>
 * @phpstan-type HeadersListOutputType array<HeaderOutputNameType, HeaderOutputValueType>
 *
 * @template-extends \Traversable<HeaderOutputNameType, HeaderOutputLineValueType>
 */
interface HeadersInterface extends \Traversable, \Countable
{
    /**
     * Returns the first header by name or the default one.
     *
     * @param HeaderInputNameType $name case-insensitive header field name to find
     * @param HeaderInputLineValueType|null $default Default value if header is not defined
     */
    public function first(string|\Stringable $name, string|\Stringable|null $default = null): ?string;

    /**
     * Returns headers list by name.
     *
     * @param HeaderInputNameType $name case-insensitive header field name to find
     *
     * @return HeaderOutputValueType
     */
    public function all(string|\Stringable $name): array;

    /**
     * Returns {@see true} if the HTTP header is defined.
     *
     * @param HeaderInputNameType $name case-insensitive header field name to find
     */
    public function has(string|\Stringable $name): bool;

    /**
     * Returns {@see true} if the given HTTP header contains
     * the given case-sensitive value.
     *
     * @param HeaderInputNameType $name case-insensitive header field name to find
     * @param HeaderInputLineValueType $value header's value to find
     */
    public function contains(string|\Stringable $name, string|\Stringable $value): bool;

    /**
     * Gets count of the headers.
     *
     * @return int<0, max>
     */
    public function count(): int;

    /**
     * @return HeadersListOutputType
     */
    public function toArray(): array;
}
