<?php

declare(strict_types=1);

namespace Boson\Contracts\Http\Component\Url;

use Boson\Contracts\Http\Exception\InvalidComponentArgumentExceptionInterface;
use Boson\Contracts\Uri\UriInterface;

/**
 * @phpstan-import-type InUrlType from EvolvableUrlProviderInterface
 * @phpstan-import-type OutUrlType from UrlProviderInterface
 *
 * @phpstan-type OutMutableUrlType OutUrlType
 */
interface MutableUrlProviderInterface extends UrlProviderInterface
{
    /**
     * Get behaviour similar to {@see UrlProviderInterface::$url}.
     *
     * @var OutMutableUrlType
     */
    public UriInterface $url {
        get;
        /**
         * Also allows to set empty or non-normalized URL/URI string or object
         *
         * @param InUrlType $url
         *
         * @throws InvalidComponentArgumentExceptionInterface
         */
        set(string|\Stringable $url);
    }
}
