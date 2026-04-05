"""Launch the Traffic Camera web UI."""

from web.server import run_server

if __name__ == "__main__":
    run_server(port=5555, debug=True)
