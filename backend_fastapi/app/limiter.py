import os
import sys
from slowapi import Limiter
from slowapi.util import get_remote_address

# Disable rate limiting during automated test runs (pytest)
is_test = (
    os.getenv("ENVIRONMENT", "").lower() in ("test", "testing")
    or "pytest" in sys.modules
    or any("pytest" in arg.lower() for arg in sys.argv)
)

limiter = Limiter(
    key_func=get_remote_address,
    enabled=not is_test
)
