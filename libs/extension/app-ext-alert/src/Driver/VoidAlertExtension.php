<?php

declare(strict_types=1);

namespace Boson\Api\Alert\Driver;

use Boson\Api\Alert\AlertCreateInfo;
use Boson\Api\Alert\AlertExtensionInterface;

final readonly class VoidAlertExtension implements AlertExtensionInterface
{
    public function create(AlertCreateInfo $info): never
    {
        throw new \RuntimeException('Unsupported operating system');
    }
}
