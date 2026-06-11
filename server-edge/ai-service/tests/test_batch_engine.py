import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.engine.batch_engine import AsyncBatchInferenceEngine

class BatchEngineTests(unittest.IsolatedAsyncioTestCase):
    async def test_batch_inference_success(self):
        mock_raw_engine = MagicMock()
        mock_raw_engine.infer.side_effect = lambda f: [{"label": "car", "confidence": 0.9}]
        
        batch_engine = AsyncBatchInferenceEngine(mock_raw_engine, batch_size=2, timeout_seconds=0.01)
        batch_engine.start()
        
        try:
            # Submit two inferences concurrently
            res1, res2 = await asyncio.gather(
                batch_engine.infer("frame1"),
                batch_engine.infer("frame2")
            )
            
            self.assertEqual(res1, [{"label": "car", "confidence": 0.9}])
            self.assertEqual(res2, [{"label": "car", "confidence": 0.9}])
            self.assertEqual(mock_raw_engine.infer.call_count, 2)
        finally:
            await batch_engine.stop()

    async def test_batch_inference_error_handling(self):
        mock_raw_engine = MagicMock()
        mock_raw_engine.infer.side_effect = Exception("GPU error")
        
        batch_engine = AsyncBatchInferenceEngine(mock_raw_engine, batch_size=2, timeout_seconds=0.01)
        batch_engine.start()
        
        try:
            with self.assertRaises(Exception) as context:
                await batch_engine.infer("frame1")
            self.assertIn("GPU error", str(context.exception))
        finally:
            await batch_engine.stop()

if __name__ == "__main__":
    unittest.main()
