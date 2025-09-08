<?php

declare(strict_types=1);

namespace Boson\WebView;

use Boson\WebView\Api\Battery\BatteryExtensionInterface;

class WebView
{
    /**
     * Gets access to the Battery API of the webview.
     */
    public readonly BatteryExtensionInterface $battery;
}
