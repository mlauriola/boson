<?php

declare(strict_types=1);

namespace Boson\Component\Http\Component;

use Boson\Component\Http\Component\Headers\HeadersNormalizer;
use Boson\Contracts\Http\Component\EvolvableHeadersInterface;
use Boson\Contracts\Http\Component\HeadersInterface;
use Stringable as HeaderInputValueType;

/**
 * An implementation of immutable headers list.
 *
 * @phpstan-import-type HeaderInputNameType from HeadersInterface
 * @phpstan-import-type HeaderOutputNameType from HeadersInterface
 *
 * @phpstan-import-type HeaderInputLineValueType from HeadersInterface
 * @phpstan-import-type HeaderOutputLineValueType from HeadersInterface
 *
 * @phpstan-import-type HeaderInputValueType from HeadersInterface
 * @phpstan-import-type HeaderOutputValueType from HeadersInterface
 *
 * @phpstan-import-type HeadersListInputType from HeadersInterface
 * @phpstan-import-type HeadersListOutputType from HeadersInterface
 *
 * @template-implements \IteratorAggregate<non-empty-lowercase-string, string>
 */
class HeadersMap implements EvolvableHeadersInterface, \IteratorAggregate
{
    /**
     * @var HeadersListOutputType
     */
    protected array $lines;

    /**
     * Expects list of header values in format:
     *
     * ```
     * [
     *      'lowercase-header-name' => ['value-1', 'value-2'],
     *      'lowercase-header-name-2' => ['value-1'],
     * ]
     * ```
     *
     * @param HeadersListInputType $headers
     */
    final public function __construct(iterable $headers = [])
    {
        $this->lines = HeadersNormalizer::normalizeHeadersList($headers);
    }

    /**
     * Creates new headers list instance from another one.
     *
     * @api
     */
    public static function createFromHeaders(HeadersInterface $headers): self
    {
        if ($headers instanceof self) {
            return clone $headers;
        }

        return new self($headers->toArray());
    }

    public function withAddedHeader(string|\Stringable $name, string|\Stringable $value): self
    {
        if ($name === '') {
            return $this;
        }

        $headers = $this->lines;
        $headers[HeadersNormalizer::normalizeHeaderName($name)][]
            = HeadersNormalizer::normalizeHeaderLineValue($value);

        return new self($headers);
    }

    public function withHeader(\Stringable|string $name, iterable|\Stringable|string $values): EvolvableHeadersInterface
    {
        $headers = $this->lines;
        $headers[HeadersNormalizer::normalizeHeaderName($name)]
            = HeadersNormalizer::normalizeHeaderValue($values);

        return new self($headers);
    }

    public function withoutHeader(string|\Stringable $name): self
    {
        if ($name === '') {
            return $this;
        }

        $headers = $this->lines;
        unset($headers[HeadersNormalizer::normalizeHeaderName($name, false)]);

        return new self($headers);
    }

    public function first(string|\Stringable $name, string|\Stringable|null $default = null): ?string
    {
        $formatted = HeadersNormalizer::normalizeHeaderName($name, false);
        $lines = $this->lines;

        if (\array_key_exists($formatted, $lines)) {
            $first = $lines[$formatted][0] ?? null;

            if ($first !== null) {
                return $first;
            }

            if ($default === null) {
                return null;
            }

            return HeadersNormalizer::normalizeHeaderLineValue($default, false);
        }

        return $default;
    }

    public function all(string|\Stringable $name): array
    {
        return $this->lines[HeadersNormalizer::normalizeHeaderName($name, false)]
            ?? [];
    }

    public function has(string|\Stringable $name): bool
    {
        $normalizedName = HeadersNormalizer::normalizeHeaderName($name, false);

        return \array_key_exists($normalizedName, $this->lines);
    }

    public function contains(string|\Stringable $name, string|\Stringable $value): bool
    {
        $normalizedName = HeadersNormalizer::normalizeHeaderName($name, false);
        $normalizedValue = HeadersNormalizer::normalizeHeaderLineValue($value, false);

        return \in_array($normalizedValue, $this->lines[$normalizedName] ?? [], true);
    }

    public function getIterator(): \Traversable
    {
        foreach ($this->lines as $index => $values) {
            $name = (string) $index;

            foreach ($values as $value) {
                yield $name => $value;
            }
        }
    }

    public function toArray(): array
    {
        return $this->lines;
    }

    public function count(): int
    {
        return \count($this->lines);
    }
}
