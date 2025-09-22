<?php

declare(strict_types=1);

namespace Boson\Api\QuitHandler;

use Boson\Application;
use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Extension;

/**
 * Registers platform-specific quit handlers during application boot.
 *
 * An extension is responsible for processing signals such as `ctrl+c`
 * (in terminal) or `kill process-name`.
 *
 * @template-extends Extension<Application>
 */
final class QuitHandlerExtensionProvider extends Extension
{
    public function __construct(
        private readonly QuitHandlerCreateInfo $info = new QuitHandlerCreateInfo(),
    ) {}

    public function load(IdentifiableInterface $ctx, EventListener $listener): null
    {
        foreach ($this->info->handlers as $handler) {
            if ($handler->register($ctx->quit(...))) {
                break;
            }
        }

        return null;
    }
}
