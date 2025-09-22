<?php

declare(strict_types=1);

namespace Boson\WebView\Api\Network;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\AvailableAs;
use Boson\Extension\Attribute\DependsOn;
use Boson\Extension\Extension;
use Boson\WebView\Api\Bindings\BindingsExtensionInterface;
use Boson\WebView\Api\Bindings\BindingsExtensionProvider;
use Boson\WebView\Api\Data\DataExtensionInterface;
use Boson\WebView\Api\Data\DataExtensionProvider;
use Boson\WebView\Api\Scripts\ScriptsExtensionInterface;
use Boson\WebView\Api\Scripts\ScriptsExtensionProvider;
use Boson\WebView\WebView;

/**
 * @template-extends Extension<WebView>
 */
#[AvailableAs(['network', NetworkExtensionInterface::class])]
#[DependsOn(ScriptsExtensionProvider::class)]
#[DependsOn(BindingsExtensionProvider::class)]
#[DependsOn(DataExtensionProvider::class)]
final class NetworkExtensionProvider extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): NetworkExtension
    {
        return new NetworkExtension(
            context: $ctx,
            listener: $listener,
            bindings: $ctx->get(BindingsExtensionInterface::class),
            scripts: $ctx->get(ScriptsExtensionInterface::class),
            data: $ctx->get(DataExtensionInterface::class),
        );
    }
}
