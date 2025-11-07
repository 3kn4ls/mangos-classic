#!/bin/bash

###############################################################################
# Script de despliegue del Panel de Administración Web
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

info() { echo -e "${CYAN}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
header() {
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

NAMESPACE="mangos-classic"

header "DESPLIEGUE DEL PANEL DE ADMINISTRACIÓN WEB"

# Paso 1: Construir imágenes Docker
header "PASO 1: CONSTRUIR IMÁGENES DOCKER"

info "Construyendo imagen de API..."
docker build -t mangos-classic/admin-api:latest admin-panel/api/
success "Imagen de API construida"

info "Construyendo imagen de Web..."
docker build -t mangos-classic/admin-web:latest admin-panel/web/
success "Imagen de Web construida"

# Importar a k3s si es necesario
if command -v k3s &> /dev/null; then
    info "Importando imágenes a k3s..."
    docker save mangos-classic/admin-api:latest | sudo k3s ctr images import -
    docker save mangos-classic/admin-web:latest | sudo k3s ctr images import -
    success "Imágenes importadas a k3s"
fi

# Paso 2: Desplegar en Kubernetes
header "PASO 2: DESPLEGAR EN KUBERNETES"

info "Desplegando API..."
kubectl apply -f kubernetes/admin-panel/api-deployment.yaml
success "API desplegada"

info "Desplegando Web..."
kubectl apply -f kubernetes/admin-panel/web-deployment.yaml
success "Web desplegada"

info "Configurando Ingress..."
kubectl apply -f kubernetes/admin-panel/ingress.yaml
success "Ingress configurado"

# Paso 3: Esperar a que esté listo
header "PASO 3: VERIFICANDO DESPLIEGUE"

info "Esperando a que la API esté lista..."
kubectl wait --for=condition=Available deployment/admin-api -n $NAMESPACE --timeout=120s
success "API está lista"

info "Esperando a que la Web esté lista..."
kubectl wait --for=condition=Available deployment/admin-web -n $NAMESPACE --timeout=120s
success "Web está lista"

# Paso 4: Mostrar información
header "DESPLIEGUE COMPLETADO"

echo ""
success "¡Panel de administración web desplegado exitosamente!"
echo ""

# Obtener IP del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

info "Acceso al panel de administración:"
echo ""
echo "  URL: http://$NODE_IP:30080"
echo ""

info "Servicios desplegados:"
kubectl get svc -n $NAMESPACE | grep admin

echo ""
info "Pods desplegados:"
kubectl get pods -n $NAMESPACE | grep admin

echo ""
warning "NOTA IMPORTANTE:"
echo "  Este panel de administración tiene acceso completo a la base de datos."
echo "  En producción, implementa autenticación y usa HTTPS."
echo ""

info "Para acceder desde fuera del cluster:"
echo "  1. Configura tu /etc/hosts:"
echo "     echo '$NODE_IP admin.mangos.local' | sudo tee -a /etc/hosts"
echo ""
echo "  2. Abre en tu navegador:"
echo "     http://admin.mangos.local:30080"
echo ""

success "═══════════════════════════════════════════════════════════════"
