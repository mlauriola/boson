<?php

declare(strict_types=1);

namespace Boson\Api\Alert;

use Boson\Api\Alert\Driver\MacOSAlertDriver;
use Boson\Api\Alert\Driver\VoidAlertDriver;
use Boson\Api\Alert\Driver\WindowsAlertDriver;
use Boson\Api\OperatingSystem\OperatingSystemExtension;
use Boson\Api\OperatingSystem\OperatingSystemInfoInterface;
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
#[AvailableAs('alert', AlertApiInterface::class)]
#[DependsOn(OperatingSystemExtension::class)]
final class AlertExtension extends Extension
{
    public function load(IdentifiableInterface $ctx, EventListener $listener): AlertApiInterface
    {
        $os = $ctx->get(OperatingSystemInfoInterface::class);

        return match (true) {
            $os->family->is(Family::Darwin) => new MacOSAlertDriver(),
            $os->family->is(Family::Windows) => new WindowsAlertDriver(),
            default => new VoidAlertDriver(),
        };
    }
}
