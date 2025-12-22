#!/bin/bash

# Docker build script for juno-web
# Usage: ./build-docker.sh [tag]

set -e

# Default values
IMAGE_TAG=${1:-"latest"}
IMAGE_NAME="juno-web"

echo "========================================="
echo "Building juno-web Docker image"
echo "========================================="
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo "========================================="

# Build the Docker image
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

echo ""
echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "To run the container (with runtime env variable):"
echo "  docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=localhost $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "Example with custom host:"
echo "  docker run -d -p 8080:80 -e REACT_APP_JUNO_PROXY=192.168.1.100 $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "To push to registry:"
echo "  docker tag $IMAGE_NAME:$IMAGE_TAG <registry>/$IMAGE_NAME:$IMAGE_TAG"
echo "  docker push <registry>/$IMAGE_NAME:$IMAGE_TAG"
echo "========================================="
