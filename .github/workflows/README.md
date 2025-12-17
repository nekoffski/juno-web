# GitHub Actions Setup

This repository uses GitHub Actions to automatically build and push Docker images to Docker Hub.

## Setup Instructions

### 1. Add Docker Hub Secrets

Go to your repository settings and add the following secrets:

- **Settings → Secrets and variables → Actions → New repository secret**

Add two secrets:

- `DOCKER_USERNAME` - Your Docker Hub username (nyek0)
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

**Recommended**: Use a Docker Hub access token instead of your password:

1. Go to [Docker Hub → Account Settings → Security](https://hub.docker.com/settings/security)
2. Click "New Access Token"
3. Name it (e.g., "GitHub Actions")
4. Copy the token and use it as `DOCKER_PASSWORD`

### 2. Workflow Triggers

The workflow runs automatically on:

- **Push to `main` branch** → Builds and tags as `latest`
- **Push to `develop` branch** → Builds and tags as `develop`
- **Push tags starting with `v`** (e.g., `v1.0.0`) → Builds and tags as version numbers
- **Pull requests to `main`** → Builds only (doesn't push)

### 3. Docker Tags

The workflow creates multiple tags:

- `latest` - Latest commit on main branch
- `main` - Main branch builds
- `develop` - Develop branch builds
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags
- `main-abc1234` - Branch + commit SHA

### 4. Multi-platform Support

Images are built for:

- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

## Usage Examples

### Pull the latest image

```bash
docker pull nyek0/juno-web:latest
```

### Pull a specific version

```bash
docker pull nyek0/juno-web:v1.0.0
```

### Run the container

```bash
docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost:8080 nyek0/juno-web:latest
```

## Creating a Release

To create a versioned release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will trigger a build and push images with tags:

- `nyek0/juno-web:v1.0.0`
- `nyek0/juno-web:v1.0`
- `nyek0/juno-web:v1`
- `nyek0/juno-web:latest` (if on main branch)
