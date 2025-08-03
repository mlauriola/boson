<?php

declare(strict_types=1);

namespace Boson\Component\Http\Component\Headers;

use Boson\Component\Http\Exception\InvalidHeaderNameException;
use Boson\Component\Http\Exception\InvalidHeaderValueException;
use Boson\Contracts\Http\Component\HeadersInterface;

/**
 * @phpstan-import-type InHeaderNameType from HeadersInterface
 * @phpstan-import-type OutHeaderNameType from HeadersInterface
 * @phpstan-import-type InHeaderValueType from HeadersInterface
 * @phpstan-import-type OutHeaderValueType from HeadersInterface
 * @phpstan-import-type InHeaderValuesType from HeadersInterface
 * @phpstan-import-type OutHeaderValuesType from HeadersInterface
 * @phpstan-import-type InHeadersListType from HeadersInterface
 * @phpstan-import-type OutHeadersListType from HeadersInterface
 */
final readonly class Header
{
    /**
     * @var non-empty-string
     */
    private const string PATTERN_RFC7230_HEADER_NAME = '/^[!#$%&\'*+.^_`|~0-9A-Za-z-]+$/D';

    /**
     * @var non-empty-string
     */
    private const string PATTERN_RFC7230_HEADER_VALUE = '/^[ \t\x21-\x7E\x80-\xFF]*$/D';

    /**
     * @param InHeaderNameType $name
     *
     * @return OutHeaderNameType
     */
    public static function castHeaderName(string|\Stringable $name, bool $validate = true): string
    {
        if ($name instanceof \Stringable) {
            try {
                $scalar = (string) $name;
            } catch (\Throwable $e) {
                throw InvalidHeaderNameException::becauseStringCastingErrorOccurs($name, $e);
            }

            $name = $scalar;
        }

        if ($name === '') {
            throw InvalidHeaderNameException::becauseHeaderNameIsEmpty();
        }

        if ($validate) {
            self::validateHeaderNameOrFail($name);
        }

        /** @var non-empty-lowercase-string */
        return \strtolower($name);
    }

    /**
     * @link http://tools.ietf.org/html/rfc7230#section-3.2
     *
     * @throws \InvalidArgumentException
     */
    private static function validateHeaderNameOrFail(string $name): void
    {
        if (\preg_match(self::PATTERN_RFC7230_HEADER_NAME, $name) === 1) {
            return;
        }

        throw InvalidHeaderNameException::becauseHeaderNameIsInvalid($name);
    }

    /**
     * @param InHeaderValueType $value
     *
     * @return OutHeaderValueType
     */
    public static function castHeaderValue(string|\Stringable $value, bool $validate = true): string
    {
        if ($value instanceof \Stringable) {
            try {
                $scalar = (string) $value;
            } catch (\Throwable $e) {
                throw InvalidHeaderValueException::becauseStringCastingErrorOccurs($value, $e);
            }

            $value = $scalar;
        }

        if ($validate) {
            self::validateHeaderValueOrFail($value);
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
     * @link http://tools.ietf.org/html/rfc7230#section-3.2
     *
     * @throws \InvalidArgumentException
     */
    public static function validateHeaderValueOrFail(string $value): void
    {
        if (\preg_match(self::PATTERN_RFC7230_HEADER_VALUE, $value) === 1) {
            return;
        }

        throw InvalidHeaderValueException::becauseHeaderValueIsInvalid($value);
    }
}
