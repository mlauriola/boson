<?php

declare(strict_types=1);

namespace Boson\Api\DetachConsole\Event;

use Boson\Api\DetachConsole\Driver\DetachConsoleDriverInterface;
use Boson\Application;
use Boson\Event\ApplicationApiIntention;

abstract class DetachConsoleIntention extends ApplicationApiIntention
{
    public function __construct(
        Application $subject,
        public readonly DetachConsoleDriverInterface $driver,
        ?int $time = null,
    ) {
        parent::__construct($subject, $time);
    }
}
