"""Configuration module with environment-based factory."""

import os

from .base import BaseConfig
from .dev import DevConfig
from .prod import ProdConfig
from .test import TestConfig

_CONFIG_MAP: dict[str, type[BaseConfig]] = {
    "dev": DevConfig,
    "test": TestConfig,
    "prod": ProdConfig,
}


def get_config(env: str | None = None) -> BaseConfig:
    """Create config instance for the given environment.

    Args:
        env: Environment name (dev, test, prod).
             Falls back to ENV environment variable, then defaults to 'dev'.

    Returns:
        Config instance for the specified environment.
    """
    if env is None:
        env = os.environ.get("ENV", "dev")
    env = env.lower()

    config_cls = _CONFIG_MAP.get(env)
    if config_cls is None:
        raise ValueError(
            f"Unknown environment: '{env}'. "
            f"Choose from: {', '.join(_CONFIG_MAP.keys())}"
        )

    return config_cls()
