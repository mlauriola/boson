<?php

declare(strict_types=1);

namespace Boson\WebView\Api\Security;

use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\AvailableAs;
use Boson\Extension\Extension;
use Boson\WebView\Api\Data\DataExtensionInterface;
use Boson\WebView\WebView;

/**
 * @template-extends Extension<WebView>
 */
#[AvailableAs(['security', SecurityExtensionInterface::class])]
final class SecurityExtensionProvider extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): SecurityExtension
    {
        return new SecurityExtension(
            webview: $ctx,
            listener: $listener,
            data: $ctx->get(DataExtensionInterface::class),
        );
    }
}
