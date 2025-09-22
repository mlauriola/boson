<?php

declare(strict_types=1);

namespace Boson\Api\Alert\Driver;

use Boson\Api\Alert\AlertApiInterface;
use Boson\Api\Alert\AlertCreateInfo;

final readonly class VoidAlertDriver implements AlertApiInterface
{
    public function create(AlertCreateInfo $info): null
    {
        return null;
    }
}
