import sqlite3
import json
import logging
import asyncio
from datetime import datetime, timezone
from src.models.event import EdgeEvent, EventType
from src.services.backend_client import forward_event_to_backend

logger = logging.getLogger(__name__)

class EventStore:
    def __init__(self, db_path: str = "events.db", sync_interval_seconds: float = 10.0):
        self.db_path = db_path
        self.sync_interval_seconds = sync_interval_seconds

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS offline_events (
                    event_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    type TEXT NOT NULL,
                    camera_id TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
            """)
            conn.commit()

    async def init_db(self):
        await asyncio.to_thread(self._init_db)

    def _add_event(self, event: EdgeEvent):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO offline_events (event_id, timestamp, type, camera_id, payload) VALUES (?, ?, ?, ?, ?)",
                (
                    event.event_id,
                    event.timestamp.isoformat(),
                    event.type.value,
                    event.camera_id,
                    json.dumps(event.payload),
                )
            )
            conn.commit()

    async def add_event(self, event: EdgeEvent):
        await asyncio.to_thread(self._add_event, event)

    def _get_pending_count(self) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM offline_events")
            return cursor.fetchone()[0]

    async def get_pending_count(self) -> int:
        return await asyncio.to_thread(self._get_pending_count)

    def _pop_pending_events(self, limit: int) -> list[EdgeEvent]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT event_id, timestamp, type, camera_id, payload FROM offline_events ORDER BY timestamp ASC LIMIT ?",
                (limit,)
            )
            rows = cursor.fetchall()
            events = []
            for row in rows:
                try:
                    event_id, timestamp_str, type_str, camera_id, payload_str = row
                    dt = datetime.fromisoformat(timestamp_str)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    events.append(EdgeEvent(
                        event_id=event_id,
                        timestamp=dt,
                        type=EventType(type_str),
                        camera_id=camera_id,
                        payload=json.loads(payload_str)
                    ))
                except Exception as e:
                    logger.error(f"Error parsing offline event row {row}: {e}")
            return events

    async def pop_pending_events(self, limit: int = 10) -> list[EdgeEvent]:
        return await asyncio.to_thread(self._pop_pending_events, limit)

    def _delete_event(self, event_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM offline_events WHERE event_id = ?", (event_id,))
            conn.commit()

    async def delete_event(self, event_id: str):
        await asyncio.to_thread(self._delete_event, event_id)

    async def run_sync(self):
        pending = await self.pop_pending_events(limit=5)
        if not pending:
            return

        logger.info(f"Syncing {len(pending)} pending offline event(s) to backend...")
        for event in pending:
            success = await forward_event_to_backend(event)
            if success:
                await self.delete_event(event.event_id)
                logger.info(f"Successfully synced and deleted offline event {event.event_id}")
            else:
                logger.warning(f"Failed to sync offline event {event.event_id}. Aborting current sync cycle.")
                break

    async def sync_loop(self, stop_event: asyncio.Event):
        await self.init_db()
        while not stop_event.is_set():
            try:
                await self.run_sync()
            except Exception as e:
                logger.exception(f"Error during offline event sync cycle: {e}")
            
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=self.sync_interval_seconds)
            except asyncio.TimeoutError:
                continue
