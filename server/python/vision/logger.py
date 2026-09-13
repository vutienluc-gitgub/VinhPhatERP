"""
Structured Logging Configuration with structlog
Provides contextual JSON logging for production and readable console logging for local dev.
"""

import logging
import sys
import structlog
from vision.config import settings


def setup_logger() -> structlog.BoundLogger:
    """Configures structlog with standard processors and correlation support."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # Console rendering for terminal, JSON formatting for server logs if needed
    if sys.stdout.isatty():
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()


logger = setup_logger()
