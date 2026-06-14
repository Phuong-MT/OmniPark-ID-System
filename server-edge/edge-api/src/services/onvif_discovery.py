import asyncio
import logging
import os
from urllib.parse import urlparse

from src.services.backend_client import publish_discoveries

logger = logging.getLogger(__name__)


def _scan() -> list[dict]:
    from wsdiscovery.discovery import ThreadedWSDiscovery as WSDiscovery
    from wsdiscovery.scope import Scope

    discovery = WSDiscovery()
    discovery.start()
    try:
        services = discovery.searchServices(
            scopes=[Scope("onvif://www.onvif.org")],
            timeout=float(os.getenv("ONVIF_DISCOVERY_TIMEOUT_SECONDS", "5")),
        )
        cameras: dict[str, dict] = {}
        for service in services:
            for address in service.getXAddrs() or []:
                parsed = urlparse(address)
                endpoint = address
                cameras[endpoint] = {
                    "endpoint": endpoint,
                    "ipAddress": parsed.hostname or "",
                    "name": service.getEPR() or parsed.hostname or "ONVIF camera",
                }
        return list(cameras.values())
    finally:
        discovery.stop()


async def discover_onvif_cameras() -> list[dict]:
    return await asyncio.to_thread(_scan)


async def run_discovery(stop_event: asyncio.Event) -> None:
    if os.getenv("ONVIF_DISCOVERY_ENABLED", "false").lower() not in {
        "1",
        "true",
        "yes",
    }:
        logger.info("ONVIF discovery is disabled")
        return

    interval = float(os.getenv("ONVIF_DISCOVERY_INTERVAL_SECONDS", "60"))
    while not stop_event.is_set():
        try:
            cameras = await discover_onvif_cameras()
            if cameras:
                await publish_discoveries(cameras)
            logger.info("ONVIF discovery completed: %s camera(s)", len(cameras))
        except Exception:
            logger.exception("ONVIF discovery failed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except asyncio.TimeoutError:
            continue
