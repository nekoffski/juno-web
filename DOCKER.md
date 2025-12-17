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

The proxy address is configured at **runtime** using an environment variable:

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost:8080 juno-web:latest
```

### Examples

**Development:**

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost:8080 juno-web:latest
```

**Production:**

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=api.example.com:443 juno-web:latest
```

**Custom port mapping:**

```bash
docker run -d -p 3000:80 -e REACT_APP_JUNO_PROXY=myserver:9000 juno-web:latest
```

## How it works

1. **Build time**: The app is built without hardcoded proxy address
2. **Runtime**: The entrypoint script injects the `REACT_APP_JUNO_PROXY` environment variable into the JavaScript bundle
3. This allows the same Docker image to be used across different environments (dev, staging, prod) with different proxy addresses

## Environment Variables

- `REACT_APP_JUNO_PROXY` - The proxy server address (e.g., `localhost:8080`, `api.example.com:443`)
  - Default: `localhost:8080` (if not provided)
