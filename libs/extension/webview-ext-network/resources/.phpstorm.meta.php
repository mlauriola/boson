<?php

namespace PHPSTORM_META {

    registerArgumentsSet('webview_ext_network_event',
        \Boson\WebView\Api\Network\Event\NetworkInfoChanged::class
    );

    expectedArguments(\Boson\Application::on(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Application::addEventListener(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Application::removeListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Application::getListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));

    expectedArguments(\Boson\Window\Window::on(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Window\Window::addEventListener(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Window\Window::removeListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\Window\Window::getListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));

    expectedArguments(\Boson\WebView\WebView::on(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\WebView\WebView::addEventListener(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\WebView\WebView::removeListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));
    expectedArguments(\Boson\WebView\WebView::getListenersForEvent(), 0, argumentsSet('webview_ext_network_event'));

}
