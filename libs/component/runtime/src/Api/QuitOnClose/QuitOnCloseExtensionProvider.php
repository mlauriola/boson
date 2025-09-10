<?php

declare(strict_types=1);

namespace Boson\Api\QuitOnClose;

use Boson\Application;
use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\ExtensionProvider;

/**
 * @template-extends ExtensionProvider<Application>
 */
final class QuitOnCloseExtensionProvider extends ExtensionProvider
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): object
    {
        return new QuitOnCloseExtension($ctx, $listener);
    }
}
