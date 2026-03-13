"""
Gunicorn Configuration for Lisan
Optimized for high concurrency with gevent async workers.
Handles hundreds of simultaneous users making I/O-bound AI API calls.
"""

import multiprocessing

# ── Server Socket ─────────────────────────────────────
bind = "0.0.0.0:5018"

# ── Worker Configuration ─────────────────────────────
# gevent workers use greenlets (lightweight coroutines) for non-blocking I/O.
# Each worker can handle ~1000 concurrent connections via cooperative scheduling.
# This is critical because the app makes external API calls (OpenRouter, Groq)
# that can block for 30+ seconds per request.
worker_class = "gevent"
workers = multiprocessing.cpu_count() * 2 + 1  # ~4-5 workers on this server
worker_connections = 1000  # Max simultaneous connections per worker
threads = 1  # Not used with gevent, but set for clarity

# ── Timeouts ─────────────────────────────────────────
# AI API calls can take up to 120s for complex grammar analysis
timeout = 120
graceful_timeout = 30
keepalive = 5

# ── Worker Lifecycle ─────────────────────────────────
# Recycle workers periodically to prevent memory leaks
max_requests = 1000
max_requests_jitter = 100  # Randomize to avoid thundering herd

# ── Logging ──────────────────────────────────────────
accesslog = "-"  # stdout (captured by PM2)
errorlog = "-"   # stderr (captured by PM2)
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sμs'

# ── Process Naming ───────────────────────────────────
proc_name = "lisan"

# ── Security ─────────────────────────────────────────
# Limit request sizes (matches Flask MAX_CONTENT_LENGTH)
limit_request_line = 8190
limit_request_fields = 100
limit_request_field_size = 8190

# ── Preloading ───────────────────────────────────────
# Preload disabled to allow gevent monkey-patching before imports
# This prevents ssl/urllib3 monkey-patch warnings
preload_app = False

# ── Server Hooks ─────────────────────────────────────
def on_starting(server):
    """Called just before the master process is initialized."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")

def worker_exit(server, worker):
    """Called when a worker exits."""
    server.log.info(f"Worker exited (pid: {worker.pid})")
