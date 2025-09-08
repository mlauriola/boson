<?php

declare(strict_types=1);

namespace Boson\WebView;

use Boson\WebView\Api\Network\NetworkExtensionInterface;

class WebView
{
    /**
     * Gets access to the Network API of the webview.
     */
    public readonly NetworkExtensionInterface $network;
}
