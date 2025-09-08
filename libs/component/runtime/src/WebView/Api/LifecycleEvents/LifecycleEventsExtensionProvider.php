<?php

declare(strict_types=1);

namespace Boson\WebView\Api\LifecycleEvents;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\ExtensionProvider;
use Boson\Extension\ExtensionProviderInterface;
use Boson\WebView\WebView;

/**
 * @template-extends ExtensionProviderInterface<WebView>
 */
final class LifecycleEventsExtensionProvider extends ExtensionProvider
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): LifecycleEventsExtension
    {
        return new LifecycleEventsExtension($ctx, $listener);
    }
}
