module.exports = {
  apps: [
    {
      name: "lisan",
      script: "/home/alaadin/lisan/venv/bin/gunicorn",
      args: "-c /home/alaadin/lisan/gunicorn.conf.py app:app",
      cwd: "/home/alaadin/lisan",
      interpreter: "none",
      // Auto-restart
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // Watch for file changes (auto-reload on code updates)
      watch: [
        "/home/alaadin/lisan/app.py",
        "/home/alaadin/lisan/ai",
        "/home/alaadin/lisan/chat",
        "/home/alaadin/lisan/config",
        "/home/alaadin/lisan/vision",
        "/home/alaadin/lisan/templates",
        "/home/alaadin/lisan/static",
        "/home/alaadin/lisan/gunicorn.conf.py"
      ],
      ignore_watch: [
        "venv",
        "uploads",
        "__pycache__",
        "*.pyc",
        ".git",
        "node_modules",
        "*.log"
      ],
      watch_delay: 2000,
      // Environment
      env: {
        FLASK_DEBUG: "false",
        FLASK_PORT: "5018",
        PYTHONUNBUFFERED: "1"
      },
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/home/alaadin/.pm2/logs/lisan-error.log",
      out_file: "/home/alaadin/.pm2/logs/lisan-out.log",
      merge_logs: true,
    }
  ]
};
