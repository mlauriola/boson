<?php

declare(strict_types=1);

namespace Boson;

use Boson\Api\Alert\AlertExtensionInterface;

class Application
{
    /**
     * Gets access to the Alert API of the application.
     */
    public readonly AlertExtensionInterface $alert;
}
