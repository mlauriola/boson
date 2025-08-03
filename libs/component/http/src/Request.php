<?php

declare(strict_types=1);

namespace Boson\Component\Http;

use Boson\Component\Http\Component\Body;
use Boson\Component\Http\Component\HeadersMap;
use Boson\Component\Http\Component\Method;
use Boson\Component\Http\Exception\InvalidBodyException;
use Boson\Component\Http\Exception\InvalidHeadersException;
use Boson\Component\Uri\Factory\UriFactory;
use Boson\Contracts\Http\Component\HeadersInterface;
use Boson\Contracts\Http\Component\MethodInterface;
use Boson\Contracts\Http\EvolvableMessageInterface;
use Boson\Contracts\Http\EvolvableRequestInterface;
use Boson\Contracts\Http\MessageInterface;
use Boson\Contracts\Http\RequestInterface;
use Boson\Contracts\Uri\Factory\UriFactoryInterface;
use Boson\Contracts\Uri\UriInterface;

/**
 * @phpstan-import-type InMethodType from EvolvableRequestInterface
 * @phpstan-import-type OutMethodType from RequestInterface
 * @phpstan-import-type InUrlType from EvolvableRequestInterface
 * @phpstan-import-type OutUrlType from RequestInterface
 * @phpstan-import-type InHeadersType from EvolvableMessageInterface
 * @phpstan-import-type OutHeadersType from MessageInterface
 * @phpstan-import-type InBodyType from EvolvableMessageInterface
 * @phpstan-import-type OutBodyType from MessageInterface
 */
class Request implements EvolvableRequestInterface
{
    /**
     * @var InMethodType
     */
    final public const string|\Stringable DEFAULT_METHOD = Method::Get;

    /**
     * @var InUrlType
     */
    final public const string|\Stringable DEFAULT_URL = 'about:blank';

    /**
     * @var InHeadersType
     */
    final public const iterable DEFAULT_HEADERS = [];

    /**
     * @var InBodyType
     */
    final public const string|\Stringable DEFAULT_BODY = '';

    /**
     * @var OutMethodType
     */
    public protected(set) MethodInterface $method {
        /**
         * @return OutMethodType
         */
        get => $this->method;
        /**
         * @param InMethodType $method
         * @return OutMethodType
         */
        set(string|\Stringable $method) => static::castMethod($method);
    }

    /**
     * @var OutUrlType
     */
    public protected(set) UriInterface $url {
        /**
         * @return OutUrlType
         */
        get => $this->url;
        /**
         * @param InUrlType $url
         * @return OutUrlType
         */
        set(string|\Stringable $url) => static::castUrl($url);
    }

    private static UriFactoryInterface $uriFactory;

    /**
     * @var OutHeadersType
     */
    public protected(set) HeadersInterface $headers {
        /**
         * @return OutHeadersType
         */
        get => $this->headers;
        /**
         * @param InHeadersType $headers
         * @throws InvalidHeadersException
         */
        set(iterable $headers) => static::castHeaders($headers);
    }

    /**
     * @var OutBodyType
     */
    public protected(set) string $body {
        /**
         * @return OutBodyType
         */
        get => $this->body;
        /**
         * @param InBodyType $body
         * @throws InvalidBodyException
         */
        set(string|\Stringable $body) => static::castBody($body);
    }

    /**
     * @param InMethodType $method
     * @param InUrlType $url
     * @param InHeadersType $headers
     * @param InBodyType $body
     */
    public function __construct(
        string|\Stringable $method = self::DEFAULT_METHOD,
        string|\Stringable $url = self::DEFAULT_URL,
        iterable $headers = self::DEFAULT_HEADERS,
        string|\Stringable $body = self::DEFAULT_BODY,
    ) {
        $this->method = $method;
        $this->url = $url;
        $this->headers = $headers;
        $this->body = $body;
    }

    /**
     * @param InMethodType $method
     * @return OutMethodType
     */
    public static function castMethod(string|\Stringable $method): MethodInterface
    {
        return Method::create($method);
    }

    /**
     * @param InUrlType $url
     * @return OutUrlType
     */
    public static function castUrl(string|\Stringable $url): UriInterface
    {
        $factory = self::$uriFactory ??= new UriFactory();

        return $factory->createUriFromString($url);
    }

    /**
     * @param InHeadersType $headers
     * @return OutHeadersType
     * @throws InvalidHeadersException
     */
    public static function castHeaders(iterable $headers): HeadersMap
    {
        return new HeadersMap($headers);
    }

    /**
     * @param InBodyType $body
     * @return OutBodyType
     * @throws InvalidBodyException
     */
    public static function castBody(string|\Stringable $body): string
    {
        return Body::create($body);
    }

    /**
     * Creates new request instance from another one.
     *
     * @api
     */
    public static function createFromRequest(RequestInterface $request): self
    {
        if ($request instanceof self) {
            return clone $request;
        }

        return new self(
            method: $request->method,
            url: $request->url,
            headers: $request->headers,
            body: $request->body,
        );
    }

    public function withMethod(\Stringable|string $method): self
    {
        $self = clone $this;
        $self->method = $method;

        return $self;
    }

    public function withUrl(\Stringable|string $url): self
    {
        $self = clone $this;
        $self->url = $url;

        return $self;
    }

    public function withHeaders(iterable $headers): self
    {
        $self = clone $this;
        $self->headers = $headers;

        return $self;
    }

    public function withBody(\Stringable|string $body): self
    {
        $self = clone $this;
        $self->body = $body;

        return $self;
    }

    public function __clone(): void
    {
        /**
         * @link https://wiki.php.net/rfc/readonly_amendments
         *
         * @phpstan-ignore-next-line : PHPStan does not support PHP 8.3 clone feature
         */
        $this->headers = clone $this->headers;
    }
}
