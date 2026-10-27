from pathlib import Path
import yaml

DEFAULT_CONFIG = Path(__file__).resolve().parents[2] / "config.yaml"


def load_config(path=None):
    """Load a YAML config file (defaults to the project's config.yaml)."""
    with open(path or DEFAULT_CONFIG, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
