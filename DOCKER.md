# Juno Web - Docker Setup

## Build the Docker image

```bash
./build-docker.sh [tag]
```

Example:

```bash
./build-docker.sh latest
./build-docker.sh v1.0.0
```

## Run the container

The host address is configured at **runtime** using an environment variable:

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost juno-web:latest
```

### Examples

**Development:**

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost juno-web:latest
```

**Production:**

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=192.168.1.100 juno-web:latest
```

**Custom port mapping:**

```bash
docker run -d -p 3000:80 -e REACT_APP_JUNO_PROXY=myserver juno-web:latest
```

## How it works

1. **Build time**: The app is built without hardcoded host address
2. **Runtime**: The entrypoint script injects the `REACT_APP_JUNO_PROXY` environment variable into the JavaScript bundle
3. This allows the same Docker image to be used across different environments (dev, staging, prod) with different backend servers
4. **Ports**: API port (8080) and WebSocket port (6010) are hardcoded in the application

## Environment Variables

- `REACT_APP_JUNO_PROXY` - The backend server hostname/IP (e.g., `localhost`, `192.168.1.100`, `api.example.com`)

  - Default: `localhost` (if not provided)
  - The app will connect to:
    - HTTP API: `http://${REACT_APP_JUNO_PROXY}:8080`
    - WebSocket: `ws://${REACT_APP_JUNO_PROXY}:6010`

- `REACT_APP_JUNO_PROXY` - The proxy server address (e.g., `localhost:8080`, `api.example.com:443`)
  - Default: `localhost:8080` (if not provided)
