<?php

declare(strict_types=1);

namespace Boson\WebView;

use Boson\WebView\Api\Battery\BatteryApiInterface;

class WebView
{
    /**
     * Gets access to the Battery API of the webview.
     */
    public readonly BatteryApiInterface $battery;
}
