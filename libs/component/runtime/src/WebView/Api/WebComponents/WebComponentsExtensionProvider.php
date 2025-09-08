<?php

declare(strict_types=1);

namespace Boson\WebView\Api\WebComponents;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\DependsOn;
use Boson\Extension\ExtensionProvider;
use Boson\WebView\Api\Bindings\BindingsExtension;
use Boson\WebView\Api\Bindings\BindingsExtensionProvider;
use Boson\WebView\Api\Scripts\ScriptsExtension;
use Boson\WebView\Api\Scripts\ScriptsExtensionProvider;
use Boson\WebView\WebView;

/**
 * @template-extends ExtensionProvider<WebView>
 */
#[DependsOn(BindingsExtensionProvider::class)]
#[DependsOn(ScriptsExtensionProvider::class)]
final class WebComponentsExtensionProvider extends ExtensionProvider
{
    public function __construct(
        private readonly WebComponentsExtensionCreateInfo $info = new WebComponentsExtensionCreateInfo(),
    ) {}

    public function load(IdentifiableInterface $ctx, EventListener $listener): WebComponentsExtension
    {
        return new WebComponentsExtension(
            context: $ctx,
            listener: $listener,
            info: $this->info,
            bindings: $ctx->get(BindingsExtension::class),
            scripts: $ctx->get(ScriptsExtension::class),
        );
    }
}
