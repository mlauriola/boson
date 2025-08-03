<?php

declare(strict_types=1);

namespace Boson\Component\Http;

use Boson\Component\Http\Component\MutableHeadersMap;
use Boson\Contracts\Http\Component\StatusCodeInterface;
use Boson\Contracts\Http\EvolvableMessageInterface;
use Boson\Contracts\Http\EvolvableResponseInterface;
use Boson\Contracts\Http\MessageInterface;
use Boson\Contracts\Http\ResponseInterface;

/**
 * @phpstan-import-type InStatusCodeType from ResponseInterface
 * @phpstan-import-type OutStatusCodeType from EvolvableResponseInterface
 * @phpstan-import-type InHeadersType from EvolvableMessageInterface
 * @phpstan-import-type OutHeadersType from MessageInterface
 * @phpstan-import-type InBodyType from EvolvableMessageInterface
 * @phpstan-import-type OutBodyType from MessageInterface
 */
class JsonResponse extends Response
{
    /**
     * @var non-empty-lowercase-string
     */
    protected const string DEFAULT_JSON_CONTENT_TYPE = 'application/json';

    /**
     * Encode <, >, ', &, and " characters in the JSON, making
     * it also safe to be embedded into HTML.
     */
    protected const int DEFAULT_JSON_ENCODING_FLAGS = \JSON_HEX_TAG
        | \JSON_HEX_APOS
        | \JSON_HEX_AMP
        | \JSON_HEX_QUOT;

    /**
     * @param InHeadersType $headers
     * @param InStatusCodeType $status
     *
     * @throws \JsonException
     */
    public function __construct(
        mixed $data = null,
        int|StatusCodeInterface $status = self::DEFAULT_STATUS_CODE,
        iterable $headers = self::DEFAULT_HEADERS,
        /**
         * JSON body encoding flags bit-mask.
         */
        protected int $jsonEncodingFlags = self::DEFAULT_JSON_ENCODING_FLAGS,
    ) {
        parent::__construct(
            body: $this->formatJsonBody($data),
            status: $status,
            headers: $headers,
        );
    }

    /**
     * Extend headers by the "application/json" content type
     * in case of content-type header has not been defined.
     */
    #[\Override]
    protected function extendHeaders(MutableHeadersMap $headers): void
    {
        if (!$headers->has('content-type')) {
            $headers->add('content-type', self::DEFAULT_JSON_CONTENT_TYPE);
        }

        parent::extendHeaders($headers);
    }

    /**
     * Encode passed data payload to a json string.
     *
     * @return InBodyType
     * @throws \JsonException
     */
    protected function formatJsonBody(mixed $data): string|\Stringable
    {
        return \json_encode($data, $this->jsonEncodingFlags | \JSON_THROW_ON_ERROR);
    }
}
