<?php

declare(strict_types=1);

namespace Boson\Contracts\OsInfo\Tests;

use Boson\Contracts\OsInfo\Family\FamilyProviderInterface;
use Boson\Contracts\OsInfo\FamilyInterface;
use Boson\Contracts\OsInfo\OperatingSystemInterface;
use Boson\Contracts\OsInfo\Standard\StandardsProviderInterface;
use Boson\Contracts\OsInfo\StandardInterface;
use Boson\Contracts\OsInfo\VendorInfoInterface;
use PHPUnit\Framework\Attributes\DoesNotPerformAssertions;
use PHPUnit\Framework\Attributes\Group;

/**
 * Note: Changing the behavior of these tests is allowed ONLY when updating
 *       a MAJOR version of the package.
 */
#[Group('boson-php/os-info-contracts')]
final class CompatibilityTest extends TestCase
{
    #[DoesNotPerformAssertions]
    public function testStandardInterfaceCompatibility(): void
    {
        new class implements StandardInterface {
            public string $name {
                get {}
            }
            public ?StandardInterface $parent {
                get {}
            }

            public function is(StandardInterface $standard): bool {}

            public function __toString(): string {}
        };
    }

    #[DoesNotPerformAssertions]
    public function testFamilyInterfaceCompatibility(): void
    {
        new class implements FamilyInterface {
            public string $name {
                get {}
            }
            public ?FamilyInterface $parent {
                get {}
            }

            public function is(FamilyInterface $family): bool {}

            public function __toString(): string {}
        };
    }

    #[DoesNotPerformAssertions]
    public function testVendorInfoInterfaceCompatibility(): void
    {
        new class implements VendorInfoInterface {
            public string $name {
                get {}
            }
            public string $version {
                get {}
            }
            public ?string $codename {
                get {}
            }
            public ?string $edition {
                get {}
            }
        };
    }

    #[DoesNotPerformAssertions]
    public function testStandardsProviderInterfaceCompatibility(): void
    {
        new class implements StandardsProviderInterface {
            public iterable $standards {
                get {}
            }

            public function isSupports(StandardInterface $standard): bool {}
        };
    }

    #[DoesNotPerformAssertions]
    public function testFamilyProviderInterfaceCompatibility(): void
    {
        new class implements FamilyProviderInterface {
            public FamilyInterface $family {
                get {}
            }
        };
    }

    #[DoesNotPerformAssertions]
    public function testOperatingSystemInterfaceCompatibility(): void
    {
        new class implements OperatingSystemInterface {
            public iterable $standards {
                get {}
            }
            public FamilyInterface $family {
                get {}
            }
            public string $name {
                get {}
            }
            public string $version {
                get {}
            }
            public ?string $codename {
                get {}
            }
            public ?string $edition {
                get {}
            }

            public function isSupports(StandardInterface $standard): bool {}
        };
    }
} 