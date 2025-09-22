<?php

declare(strict_types=1);

namespace Boson\Api\Alert;

use Boson\Api\Alert\Driver\MacOSAlertExtension;
use Boson\Api\Alert\Driver\VoidAlertExtension;
use Boson\Api\Alert\Driver\WindowsAlertExtension;
use Boson\Api\OperatingSystem\OperatingSystemExtensionInterface;
use Boson\Api\OperatingSystem\OperatingSystemExtensionProvider;
use Boson\Application;
use Boson\Component\OsInfo\Family;
use Boson\Contracts\Id\IdentifiableInterface;
use Boson\Dispatcher\EventListener;
use Boson\Extension\Attribute\AvailableAs;
use Boson\Extension\Attribute\DependsOn;
use Boson\Extension\Extension;

/**
 * @template-extends Extension<Application>
 */
#[AvailableAs(['alert', AlertExtensionInterface::class])]
#[DependsOn(OperatingSystemExtensionProvider::class)]
final class AlertExtensionProvider extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): AlertExtensionInterface
    {
        $os = $ctx->get(OperatingSystemExtensionInterface::class);

        return match (true) {
            $os->family->is(Family::Darwin) => new MacOSAlertExtension(),
            $os->family->is(Family::Windows) => new WindowsAlertExtension(),
            default => new VoidAlertExtension(),
        };
    }
}
