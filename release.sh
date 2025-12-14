#!/bin/bash

# Script de release para admin-panel (MaNGOS Classic)
# Uso: ./release.sh [patch|minor|major] "mensaje del commit"

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Variables
API_IMAGE="mangos-classic/admin-api"
WEB_IMAGE="mangos-classic/admin-web"
API_DEPLOYMENT="kubernetes/admin-panel/api-deployment.yaml"
WEB_DEPLOYMENT="kubernetes/admin-panel/web-deployment.yaml"
VERSION_FILE="VERSION"

if [ ! -f "$VERSION_FILE" ]; then
    echo "1.0.0" > "$VERSION_FILE"
fi

CURRENT_VERSION=$(cat "$VERSION_FILE")
print_info "Versión actual: $CURRENT_VERSION"

increment_version() {
    local version=$1
    local type=$2

    IFS='.' read -r -a parts <<< "$version"
    local major="${parts[0]}"
    local minor="${parts[1]}"
    local patch="${parts[2]}"

    case "$type" in
        major) major=$((major + 1)); minor=0; patch=0 ;;
        minor) minor=$((minor + 1)); patch=0 ;;
        patch) patch=$((patch + 1)) ;;
        *) print_error "Tipo inválido: $type"; exit 1 ;;
    esac

    echo "${major}.${minor}.${patch}"
}

VERSION_TYPE=${1:-patch}
COMMIT_MESSAGE=${2:-"Release"}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Tipo debe ser: patch, minor o major"
    exit 1
fi

NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$VERSION_TYPE")
print_info "Nueva versión: $NEW_VERSION"

# Construir imágenes
print_info "Paso 1/5: Construyendo imágenes..."
docker build --platform linux/arm64 -t ${API_IMAGE}:v${NEW_VERSION} -t ${API_IMAGE}:latest -f admin-panel/api/Dockerfile ./admin-panel/api
docker build --platform linux/arm64 -t ${WEB_IMAGE}:v${NEW_VERSION} -t ${WEB_IMAGE}:latest -f admin-panel/web/Dockerfile ./admin-panel/web

# Importar a k3s
print_info "Paso 2/5: Importando a k3s..."
docker save ${API_IMAGE}:v${NEW_VERSION} -o /tmp/admin-api.tar
sudo k3s ctr images import /tmp/admin-api.tar
rm /tmp/admin-api.tar

docker save ${WEB_IMAGE}:v${NEW_VERSION} -o /tmp/admin-web.tar
sudo k3s ctr images import /tmp/admin-web.tar
rm /tmp/admin-web.tar

# Actualizar VERSION
print_info "Paso 3/5: Actualizando VERSION..."
echo "$NEW_VERSION" > "$VERSION_FILE"

# Actualizar deployments
print_info "Paso 4/5: Actualizando deployments..."
sed -i "s|image: ${API_IMAGE}:v.*|image: ${API_IMAGE}:v${NEW_VERSION}|g" "$API_DEPLOYMENT"
sed -i "s|image: ${API_IMAGE}:latest|image: ${API_IMAGE}:v${NEW_VERSION}|g" "$API_DEPLOYMENT"

sed -i "s|image: ${WEB_IMAGE}:v.*|image: ${WEB_IMAGE}:v${NEW_VERSION}|g" "$WEB_DEPLOYMENT"
sed -i "s|image: ${WEB_IMAGE}:latest|image: ${WEB_IMAGE}:v${NEW_VERSION}|g" "$WEB_DEPLOYMENT"

# Commit y push
print_info "Paso 5/5: Commit y push..."
git add "$VERSION_FILE" "$API_DEPLOYMENT" "$WEB_DEPLOYMENT"
git commit -m "release: v${NEW_VERSION} - ${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin master

if [ $? -eq 0 ]; then
    print_info ""
    print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "✅ Release v${NEW_VERSION} completado!"
    print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info ""
    print_info "📦 API: ${API_IMAGE}:v${NEW_VERSION}"
    print_info "📦 Web: ${WEB_IMAGE}:v${NEW_VERSION}"
    print_warning "ArgoCD sincronizará automáticamente en ~3 minutos"
fi
