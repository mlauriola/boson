<?php

declare(strict_types=1);

namespace Boson\Api\Alert\Driver;

use Boson\Api\Alert\Driver\Windows\User32;
use Boson\Api\Alert\AlertButton;
use Boson\Api\Alert\AlertCreateInfo;
use Boson\Api\Alert\AlertExtensionInterface;
use Boson\Api\Alert\AlertIcon;
use FFI\CData;

final readonly class WindowsAlertExtension implements AlertExtensionInterface
{
    public function __construct(
        private User32 $user32 = new User32(),
    ) {}

    private function string(string $text): CData
    {
        // Format text new lines
        $text = \str_replace(["\r\n", "\n"], "\r\n", $text);

        // Windows OS expects UTF-16
        $string = \iconv('utf-8', 'utf-16le', $text) . "\0\0";
        // There are 2 bytes per character
        $length = (int) (\strlen($string) / 2);

        $result = $this->user32->new("wchar_t[$length]", false);

        \FFI::memcpy($result, $string, \strlen($string));

        return $result;
    }

    public function create(AlertCreateInfo $info): ?AlertButton
    {
        $title = $this->string($info->title);
        $text = $this->string($info->text);

        $flags = match ($info->icon) {
            AlertIcon::Error => User32::MB_ICONERROR,
            AlertIcon::Warning => User32::MB_ICONWARNING,
            AlertIcon::Info => User32::MB_ICONINFORMATION,
            default => 0,
        };

        if ($info->cancel) {
            $flags |= User32::MB_OKCANCEL;
        }

        $result = $this->user32->MessageBoxW(null, $text, $title, $flags);

        \FFI::free($title);
        \FFI::free($text);

        return match ($result) {
            User32::IDOK => AlertButton::Ok,
            User32::IDCANCEL => AlertButton::Cancel,
            default => null,
        };
    }
}
