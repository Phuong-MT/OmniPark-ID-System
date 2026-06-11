import asyncio
import logging

logger = logging.getLogger(__name__)

class AsyncBatchInferenceEngine:
    def __init__(self, engine, batch_size: int = 4, timeout_seconds: float = 0.05):
        self.engine = engine
        self.batch_size = batch_size
        self.timeout_seconds = timeout_seconds
        self.queue = asyncio.Queue()
        self._sync_task = None
        self._stop_event = asyncio.Event()

    def start(self):
        self._stop_event.clear()
        self._sync_task = asyncio.create_task(self._process_loop())
        logger.info("Batch inference engine queue reader started")

    async def stop(self):
        self._stop_event.set()
        if self._sync_task:
            self._sync_task.cancel()
            await asyncio.gather(self._sync_task, return_exceptions=True)
            self._sync_task = None
        logger.info("Batch inference engine queue reader stopped")

    async def infer(self, frame) -> list:
        # Create a future to await result from batch execution
        future = asyncio.get_running_loop().create_future()
        await self.queue.put((frame, future))
        return await future

    async def _process_loop(self):
        while not self._stop_event.is_set():
            batch = []
            try:
                # Wait for the first frame blockingly (async)
                item = await self.queue.get()
                batch.append(item)
                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error reading from inference queue: {e}")
                continue

            # Gather additional frames up to batch_size until timeout is reached
            start_time = asyncio.get_running_loop().time()
            while len(batch) < self.batch_size:
                elapsed = asyncio.get_running_loop().time() - start_time
                remaining = self.timeout_seconds - elapsed
                if remaining <= 0:
                    break
                try:
                    item = await asyncio.wait_for(self.queue.get(), timeout=max(remaining, 0.001))
                    batch.append(item)
                    self.queue.task_done()
                except asyncio.TimeoutError:
                    break
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error gathering from inference queue: {e}")
                    break

            if batch:
                frames = [item[0] for item in batch]
                futures = [item[1] for item in batch]
                
                try:
                    # Run inference for the frames sequentially in a single thread-pool execution
                    # to prevent GPU contention / GIL thrashing between multiple threads.
                    results = []
                    for f in frames:
                        res = await asyncio.to_thread(self.engine.infer, f)
                        results.append(res)
                        
                    for future, res in zip(futures, results):
                        if not future.done():
                            future.set_result(res)
                except Exception as e:
                    logger.exception(f"Error in batch inference: {e}")
                    for future in futures:
                        if not future.done():
                            future.set_exception(e)
