<?php

declare(strict_types=1);

namespace Boson;

use Boson\Api\Alert\AlertApiInterface;

class Application
{
    /**
     * Gets access to the Alert API of the application.
     */
    public readonly AlertApiInterface $alert;
}
