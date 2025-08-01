<?php

declare(strict_types=1);

namespace Boson\Component\Http\Component\Headers;

use Boson\Contracts\Http\Component\HeadersInterface;

/**
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
 */
final readonly class HeadersNormalizer
{
    private function __construct() {}

    /**
     * According to HTTP specifications, specifically RFC-9110 and its
     * predecessors like RFC-2616 and RFC-7230, HTTP header names are
     * case-insensitive. This means that "Content-Type", "content-type",
     * and "CONTENT-TYPE" are all treated as the same header name by
     * compliant HTTP implementations.
     *
     * While the standard dictates case-insensitivity, HTTP/2 mandates
     * that header names be converted to lowercase for various reasons,
     * including performance optimization and simplification. Therefore,
     * if interacting with an HTTP/2 server, the header names will
     * consistently appear in lowercase.
     *
     * @param HeaderInputNameType $name
     * @return HeaderOutputNameType
     */
    public static function normalizeHeaderName(string|\Stringable $name, bool $validate = true): string
    {
        if ($name instanceof \Stringable) {
            // TODO Add try/catch for casting exception
            $name = (string) $name;
        }

        if ($validate) {
            HeadersValidator::assertValidHeaderName($name);
        }

        return \strtolower($name);
    }

    /**
     * @param HeaderInputLineValueType $value
     * @return HeaderOutputLineValueType
     */
    public static function normalizeHeaderLineValue(string|\Stringable $value, bool $validate = true): string
    {
        if ($value instanceof \Stringable) {
            // TODO Add try/catch for casting exception
            $value = (string) $value;
        }

        if ($validate) {
            HeadersValidator::assertValidHeaderValue($value);
        }

        //
        // @link https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.4
        //
        // Whitespaces and tabs are valid header value chars but must
        // be removed in case of value is prefixed or suffixed:
        //
        // - `obs-fold = CRLF 1*( SP / HTAB )`
        //
        // TBD: LF/CRLF should be also removed?
        //
        return \trim($value, " \t");
    }

    /**
     * @param HeaderInputValueType $values
     * @return HeaderOutputValueType
     */
    public static function normalizeHeaderValue(
        string|\Stringable|iterable $values,
        bool $validate = true,
    ): array {
        $result = [];

        if (!\is_iterable($values)) {
            $values = [$values];
        }

        foreach ($values as $value) {
            $result[] = self::normalizeHeaderLineValue($value, $validate);
        }

        return $result;
    }

    /**
     * @param HeadersListInputType $headers
     * @return HeadersListOutputType
     */
    public static function normalizeHeadersList(iterable $headers, bool $validate = true): array
    {
        $result = [];

        foreach ($headers as $name => $values) {
            $normalizedName = self::normalizeHeaderName($name, $validate);
            $normalizedValues = self::normalizeHeaderValue($values, $validate);

            $result[$normalizedName] = isset($result[$normalizedName])
                ? \array_merge($result[$normalizedName], $normalizedValues)
                : $normalizedValues;
        }

        return $result;
    }
}
