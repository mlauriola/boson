<?php

declare(strict_types=1);

namespace Boson\WebView\Api\Battery;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\AvailableAs;
use Boson\Extension\Attribute\DependsOn;
use Boson\Extension\ExtensionProvider;
use Boson\WebView\Api\Bindings\BindingsExtension;
use Boson\WebView\Api\Bindings\BindingsExtensionProvider;
use Boson\WebView\Api\Data\DataExtension;
use Boson\WebView\Api\Data\DataExtensionProvider;
use Boson\WebView\Api\Scripts\ScriptsExtension;
use Boson\WebView\Api\Scripts\ScriptsExtensionProvider;
use Boson\WebView\Api\Security\SecurityExtension;
use Boson\WebView\Api\Security\SecurityExtensionProvider;
use Boson\WebView\WebView;

/**
 * @template-extends ExtensionProvider<WebView>
 */
#[DependsOn(DataExtensionProvider::class)]
#[DependsOn(ScriptsExtensionProvider::class)]
#[DependsOn(BindingsExtensionProvider::class)]
#[DependsOn(SecurityExtensionProvider::class)]
#[AvailableAs(['battery', BatteryExtensionInterface::class])]
final class BatteryExtensionProvider extends ExtensionProvider
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): ClientBatteryExtension
    {
        return new ClientBatteryExtension(
            context: $ctx,
            listener: $listener,
            bindings: $ctx->get(BindingsExtension::class),
            data: $ctx->get(DataExtension::class),
            scripts: $ctx->get(ScriptsExtension::class),
            security: $ctx->get(SecurityExtension::class),
        );
    }
}
