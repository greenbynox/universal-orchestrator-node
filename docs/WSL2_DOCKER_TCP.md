# WSL2 / Docker over TCP (Windows)

This project can run Docker either via **Docker Desktop** or via a **Docker Engine inside WSL2**.

> Security warning: exposing Docker over TCP without TLS is equivalent to giving root-level control of your machine. Only bind to localhost/private networks and never expose `2375` publicly.

## Option A (recommended): Docker Desktop

- Install Docker Desktop
- Enable WSL2 integration (Settings → Resources → WSL Integration)
- Start Docker Desktop

The orchestrator should be able to connect using the default Docker socket/pipe.

## Option B: Docker Engine inside WSL2 + TCP

Typical scenario: Docker daemon runs inside your WSL distro and you expose it to Windows via `tcp://<WSL_IP>:2375`.

### 1) Install engine in WSL
Use the helper script:
- `scripts/install-docker-engine-wsl.ps1`

Or install manually (Docker Engine + docker CLI) in your WSL distro.

### 2) Expose the daemon (WSL)
In your WSL distro, configure `dockerd` to listen on TCP.

Recommended binding (reduce risk):
- bind to the WSL distro IP, not `0.0.0.0`

### 3) Configure the orchestrator
Set the Docker host endpoint to the WSL IP:
- `DOCKER_HOST=tcp://<WSL_IP>:2375`

If the WSL IP changes after reboot, you need to update it (or rely on the project’s auto-detection logic).

### 4) Verify
- Docker must be reachable from Windows.
- The orchestrator will retry and fall back when needed, but **Docker must be running**.

## Troubleshooting

- Docker unreachable:
  - Ensure the daemon is started inside WSL
  - Ensure Windows firewall rules allow traffic from localhost to WSL
  - Re-check the WSL IP (`wsl hostname -I` inside WSL)

- Port conflicts:
  - The orchestrator may auto-bump some ports when collisions are detected.
