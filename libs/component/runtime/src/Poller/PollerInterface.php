<?php

declare(strict_types=1);

namespace Boson\Poller;

interface PollerInterface
{
    /**
     * Poll next application loop event.
     */
    public function next(): void;

    /**
     * Returns an object used to suspend and resume
     * execution of the current process.
     */
    public function createSuspension(): SuspensionInterface;

    /**
     * Defer the execution of a callback.
     *
     * @template TArgTaskId of array-key
     *
     * @param callable(TArgTaskId):void $task the callback to defer
     *
     * @return TArgTaskId an unique identifier that can be used to cancel
     *         the callback
     */
    public function defer(callable $task): int|string;

    /**
     * Repeatedly execute a callback.
     *
     * @template TArgTaskId of array-key
     *
     * @param callable(TArgTaskId):void $task the callback to execute
     *
     * @return TArgTaskId an unique identifier that can be used to cancel
     *         the callback
     */
    public function repeat(callable $task): int|string;

    /**
     * Delay the execution of a callback.
     *
     * @template TArgTaskId of array-key
     *
     * @param float $delay the amount of time, in seconds, to delay the execution for
     * @param callable(TArgTaskId):void $task the callback to delay
     *
     * @return TArgTaskId a unique identifier that can be used to
     *         cancel the callback
     */
    public function delay(float $delay, callable $task): int|string;

    /**
     * Cancel a task.
     *
     * This will detach the event loop from all resources that are associated
     * to the callback. After this operation the callback is permanently
     * invalid. Calling this function MUST NOT fail, even if passed an invalid
     * identifier.
     *
     * @param array-key $taskId the callback identifier
     */
    public function cancel(int|string $taskId): void;
}
