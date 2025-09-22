<?php

declare(strict_types=1);

namespace Boson\WebView\Api\Battery;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\AvailableAs;
use Boson\Extension\Attribute\DependsOn;
use Boson\Extension\Extension;
use Boson\WebView\Api\Bindings\BindingsApiInterface;
use Boson\WebView\Api\Bindings\BindingsExtension;
use Boson\WebView\Api\Data\DataExtension;
use Boson\WebView\Api\Data\DataRetrieverInterface;
use Boson\WebView\Api\Scripts\ScriptsApiInterface;
use Boson\WebView\Api\Scripts\ScriptsExtension;
use Boson\WebView\Api\Security\SecurityExtension;
use Boson\WebView\Api\Security\SecurityInfoInterface;
use Boson\WebView\WebView;

/**
 * @template-extends Extension<WebView>
 */
#[DependsOn(DataExtension::class)]
#[DependsOn(ScriptsExtension::class)]
#[DependsOn(BindingsExtension::class)]
#[DependsOn(SecurityExtension::class)]
#[AvailableAs('battery', BatteryApiInterface::class)]
final class BatteryExtension extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): BatteryApi
    {
        return new BatteryApi(
            context: $ctx,
            listener: $listener,
            bindings: $ctx->get(BindingsApiInterface::class),
            data: $ctx->get(DataRetrieverInterface::class),
            scripts: $ctx->get(ScriptsApiInterface::class),
            security: $ctx->get(SecurityInfoInterface::class),
        );
    }
}
