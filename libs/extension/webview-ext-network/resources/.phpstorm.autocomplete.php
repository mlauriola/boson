<?php

declare(strict_types=1);

namespace Boson\WebView;

use Boson\WebView\Api\Network\NetworkApiInterface;

class WebView
{
    /**
     * Gets access to the Network API of the webview.
     */
    public readonly NetworkApiInterface $network;
}
