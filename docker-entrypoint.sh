#!/bin/sh

# docker-entrypoint.sh
# This script injects runtime environment variables into the React build

set -e

# Default value if not provided
REACT_APP_JUNO_PROXY=${REACT_APP_JUNO_PROXY:-"localhost:8080"}

echo "========================================="
echo "Injecting runtime environment variables"
echo "========================================="
echo "REACT_APP_JUNO_PROXY: $REACT_APP_JUNO_PROXY"
echo "========================================="

# Find all JavaScript files in the build
find /usr/share/nginx/html -type f -name '*.js' -exec sed -i \
  "s|REACT_APP_JUNO_PROXY_PLACEHOLDER|$REACT_APP_JUNO_PROXY|g" {} \;

echo "Environment variables injected successfully"

# Execute the CMD
exec "$@"
