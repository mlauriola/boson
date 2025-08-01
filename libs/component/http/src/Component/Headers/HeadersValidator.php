<?php

declare(strict_types=1);

namespace Boson\Component\Http\Component\Headers;

use Boson\Contracts\Http\Component\HeadersInterface;

/**
 * @phpstan-import-type HeaderOutputNameType from HeadersInterface
 * @phpstan-import-type HeaderOutputLineValueType from HeadersInterface
 * @phpstan-import-type HeaderOutputValueType from HeadersInterface
 * @phpstan-import-type HeadersListOutputType from HeadersInterface
 */
final readonly class HeadersValidator
{
    /**
     * @var non-empty-string
     */
    private const string PATTERN_HEADER_NAME = '/^[!#$%&\'*+.^_`|~0-9A-Za-z-]+$/D';

    /**
     * @var non-empty-string
     */
    private const string PATTERN_HEADER_VALUE = '/^[ \t\x21-\x7E\x80-\xFF]*$/D';

    private function __construct() {}

    /**
     * @link http://tools.ietf.org/html/rfc7230#section-3.2
     *
     * @return ($name is non-empty-string ? void : never)
     * @throws \InvalidArgumentException
     */
    public static function assertValidHeaderName(string $name): void
    {
        if ($name === '') {
            // TODO extract to separate exception
            throw new \InvalidArgumentException('Header name cannot be empty');
        }

        if (\preg_match(self::PATTERN_HEADER_NAME, $name) !== 1) {
            // TODO extract to separate exception
            throw new \InvalidArgumentException(\sprintf(
                'Header name must be compatible with RFC 7230, but "%s" given',
                \addcslashes($name, '"'),
            ));
        }
    }

    /**
     * @link http://tools.ietf.org/html/rfc7230#section-3.2
     *
     * @throws \InvalidArgumentException
     */
    public static function assertValidHeaderValue(string $value): void
    {
        if (\preg_match(self::PATTERN_HEADER_VALUE, $value) !== 1) {
            // TODO extract to separate exception
            throw new \InvalidArgumentException(\sprintf(
                'Header value must be compatible with RFC 7230, but "%s" given',
                \addcslashes($value, '"'),
            ));
        }
    }
}
