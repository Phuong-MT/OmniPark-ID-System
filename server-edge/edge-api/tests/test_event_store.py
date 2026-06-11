import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.models.event import EdgeEvent, EventType
from src.services.event_store import EventStore

class EventStoreTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Use a unique file-based SQLite database for each test to ensure perfect isolation
        import uuid
        self.db_path = f"test_events_{uuid.uuid4().hex}.db"
        self.store = EventStore(db_path=self.db_path, sync_interval_seconds=0.01)
        await self.store.init_db()

    async def asyncTearDown(self):
        import os
        try:
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
        except Exception:
            pass

    async def test_add_and_pop_events(self):
        event1 = EdgeEvent(
            event_id="evt-1",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A12345", "confidence": 0.95}
        )
        event2 = EdgeEvent(
            event_id="evt-2",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A67890", "confidence": 0.9}
        )

        await self.store.add_event(event1)
        await self.store.add_event(event2)

        count = await self.store.get_pending_count()
        self.assertEqual(count, 2)

        pending = await self.store.pop_pending_events(limit=5)
        self.assertEqual(len(pending), 2)
        self.assertEqual(pending[0].event_id, "evt-1")
        self.assertEqual(pending[1].event_id, "evt-2")

    async def test_delete_event(self):
        event = EdgeEvent(
            event_id="evt-1",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A12345", "confidence": 0.95}
        )
        await self.store.add_event(event)
        await self.store.delete_event("evt-1")
        count = await self.store.get_pending_count()
        self.assertEqual(count, 0)

    @patch("src.services.event_store.forward_event_to_backend")
    async def test_sync_loop_success(self, mock_forward):
        mock_forward.return_value = True
        event = EdgeEvent(
            event_id="evt-1",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A12345", "confidence": 0.95}
        )
        await self.store.add_event(event)

        await self.store.run_sync()
        mock_forward.assert_called_once()
        count = await self.store.get_pending_count()
        self.assertEqual(count, 0)

    @patch("src.services.event_store.forward_event_to_backend")
    async def test_sync_loop_failure_stops_pipeline(self, mock_forward):
        mock_forward.return_value = False
        event1 = EdgeEvent(
            event_id="evt-1",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A12345", "confidence": 0.95}
        )
        event2 = EdgeEvent(
            event_id="evt-2",
            timestamp=datetime.now(timezone.utc),
            type=EventType.PLATE_DETECTED,
            camera_id="cam-1",
            payload={"plate_number": "30A67890", "confidence": 0.9}
        )
        await self.store.add_event(event1)
        await self.store.add_event(event2)

        await self.store.run_sync()
        mock_forward.assert_called_once_with(event1) # Failed on event1, should not call event2
        count = await self.store.get_pending_count()
        self.assertEqual(count, 2) # Both should still be in the database

if __name__ == "__main__":
    unittest.main()
