<?php

declare(strict_types=1);

namespace Boson\Api\QuitOnClose;

use Boson\Application;
use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\ExtensionProvider;

/**
 * Controls application shutdown behavior when all windows are closed.
 *
 * @template-extends ExtensionProvider<Application>
 */
final class QuitOnCloseExtensionProvider extends ExtensionProvider
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): null
    {
        // There is no point in keeping this handler in memory.
        // The only possible reference (event listener)
        // will keep it in memory if necessary.
        new QuitOnCloseHandler($ctx, $listener);

        return null;
    }
}
