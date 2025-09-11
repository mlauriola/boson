<?php

declare(strict_types=1);

namespace Boson\Api\DetachConsole\Event;

use Boson\Shared\Marker\AsApplicationIntention;

#[AsApplicationIntention]
final class ConsoleDetaching extends DetachConsoleIntention {}
