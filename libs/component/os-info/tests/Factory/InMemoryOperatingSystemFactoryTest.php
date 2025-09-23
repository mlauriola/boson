<?php

declare(strict_types=1);

namespace Boson\Component\OsInfo\Tests\Factory;

use Boson\Component\OsInfo\Factory\InMemoryOperatingSystemFactory;
use Boson\Component\OsInfo\Factory\OperatingSystemFactoryInterface;
use Boson\Component\OsInfo\Tests\TestCase;
use Boson\Contracts\OsInfo\OperatingSystemInterface;
use PHPUnit\Framework\Attributes\DoesNotPerformAssertions;
use PHPUnit\Framework\Attributes\Group;

#[Group('boson-php/os-info')]
final class InMemoryOperatingSystemFactoryTest extends TestCase
{
    #[DoesNotPerformAssertions]
    public function testConstructorWithDelegate(): void
    {
        $delegate = $this->createMock(OperatingSystemFactoryInterface::class);

        new InMemoryOperatingSystemFactory($delegate);
    }

    public function testCreateOperatingSystemFromGlobalsCallsDelegate(): void
    {
        $expectedOs = $this->createMock(OperatingSystemInterface::class);
        $delegate = $this->createMock(OperatingSystemFactoryInterface::class);
        $delegate->expects(self::once())
            ->method('createOperatingSystem')
            ->willReturn($expectedOs);

        $factory = new InMemoryOperatingSystemFactory($delegate);
        $os = $factory->createOperatingSystem();

        self::assertSame($expectedOs, $os);
    }

    public function testCreateOperatingSystemFromGlobalsCachesResult(): void
    {
        $expectedOs = $this->createMock(OperatingSystemInterface::class);
        $delegate = $this->createMock(OperatingSystemFactoryInterface::class);
        $delegate->expects(self::once())
            ->method('createOperatingSystem')
            ->willReturn($expectedOs);

        $factory = new InMemoryOperatingSystemFactory($delegate);

        // First call should call delegate
        $os1 = $factory->createOperatingSystem();

        // Second call should return cached result
        $os2 = $factory->createOperatingSystem();

        self::assertSame($expectedOs, $os1);
        self::assertSame($expectedOs, $os2);
        self::assertSame($os1, $os2);
    }

    public function testCreateOperatingSystemFromGlobalsReturnsOperatingSystemInterface(): void
    {
        $expectedOs = $this->createMock(OperatingSystemInterface::class);
        $delegate = $this->createMock(OperatingSystemFactoryInterface::class);
        $delegate->method('createOperatingSystem')
            ->willReturn($expectedOs);

        $factory = new InMemoryOperatingSystemFactory($delegate);
        $os = $factory->createOperatingSystem();

        self::assertInstanceOf(OperatingSystemInterface::class, $os);
    }
}
