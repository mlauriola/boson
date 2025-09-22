<?php

declare(strict_types=1);

namespace Boson\WebView\Api\Network;

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
use Boson\WebView\WebView;

/**
 * @template-extends Extension<WebView>
 */
#[AvailableAs('network', NetworkApiInterface::class)]
#[DependsOn(ScriptsExtension::class)]
#[DependsOn(BindingsExtension::class)]
#[DependsOn(DataExtension::class)]
final class NetworkExtension extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): NetworkApi
    {
        return new NetworkApi(
            context: $ctx,
            listener: $listener,
            bindings: $ctx->get(BindingsApiInterface::class),
            scripts: $ctx->get(ScriptsApiInterface::class),
            data: $ctx->get(DataRetrieverInterface::class),
        );
    }
}
