#!/bin/bash

###############################################################################
# Script de despliegue automatizado de mangos-classic en k3s
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Funciones de output
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

# Variables
NAMESPACE="mangos-classic"
REGISTRY="${REGISTRY:-localhost:5000}"
VERSION="${VERSION:-latest}"

# Verificar kubectl
if ! command -v kubectl &> /dev/null; then
    error "kubectl no está instalado"
    exit 1
fi

# Verificar conexión a k3s
if ! kubectl cluster-info &> /dev/null; then
    error "No se puede conectar al cluster k3s"
    exit 1
fi

header "DESPLIEGUE DE MANGOS-CLASSIC EN K3S"

info "Namespace: $NAMESPACE"
info "Registry: $REGISTRY"
info "Version: $VERSION"

# Paso 1: Construir imágenes Docker
header "PASO 1: CONSTRUIR IMÁGENES DOCKER"

info "Construyendo imagen builder..."
docker build -t mangos-classic/builder:${VERSION} -f docker/builder/Dockerfile .
success "Imagen builder construida"

info "Construyendo imagen database..."
docker build -t mangos-classic/database:${VERSION} -f docker/database/Dockerfile .
success "Imagen database construida"

info "Construyendo imagen realmd..."
docker build -t mangos-classic/realmd:${VERSION} -f docker/realmd/Dockerfile .
success "Imagen realmd construida"

info "Construyendo imagen mangosd..."
docker build -t mangos-classic/mangosd:${VERSION} -f docker/mangosd/Dockerfile .
success "Imagen mangosd construida"

# Paso 2: Subir imágenes al registry (opcional)
if [ -n "$PUSH_IMAGES" ]; then
    header "PASO 2: SUBIR IMÁGENES AL REGISTRY"

    for image in builder database realmd mangosd; do
        info "Taggeando mangos-classic/${image}:${VERSION} -> ${REGISTRY}/mangos-classic/${image}:${VERSION}"
        docker tag mangos-classic/${image}:${VERSION} ${REGISTRY}/mangos-classic/${image}:${VERSION}

        info "Subiendo ${REGISTRY}/mangos-classic/${image}:${VERSION}..."
        docker push ${REGISTRY}/mangos-classic/${image}:${VERSION}
        success "Imagen ${image} subida"
    done
fi

# Paso 3: Crear namespace
header "PASO 3: CREAR NAMESPACE"

if kubectl get namespace $NAMESPACE &> /dev/null; then
    warning "Namespace $NAMESPACE ya existe"
else
    kubectl apply -f kubernetes/base/namespace.yaml
    success "Namespace $NAMESPACE creado"
fi

# Paso 4: Aplicar secrets
header "PASO 4: CONFIGURAR SECRETS"

info "Aplicando secrets de base de datos..."
kubectl apply -f kubernetes/secrets/database-secrets.yaml
success "Secrets aplicados"

warning "IMPORTANTE: Cambiar las contraseñas en kubernetes/secrets/database-secrets.yaml en producción"

# Paso 5: Aplicar ConfigMaps
header "PASO 5: CONFIGURAR CONFIGMAPS"

info "Aplicando ConfigMap de realmd..."
kubectl apply -f kubernetes/configmaps/realmd-config.yaml
success "ConfigMap realmd aplicado"

info "Aplicando ConfigMap de mangosd..."
kubectl apply -f kubernetes/configmaps/mangosd-config.yaml
success "ConfigMap mangosd aplicado"

info "Aplicando ConfigMap de playerbot..."
kubectl apply -f kubernetes/configmaps/playerbot-config.yaml
success "ConfigMap playerbot aplicado"

# Paso 6: Crear PVCs
header "PASO 6: CREAR VOLÚMENES PERSISTENTES"

info "Creando PersistentVolumeClaims..."
kubectl apply -f kubernetes/storage/persistent-volumes.yaml
success "PVCs creados"

info "Esperando a que los PVCs estén bound..."
kubectl wait --for=condition=Bound pvc/game-data-pvc pvc/server-logs-pvc -n $NAMESPACE --timeout=60s || warning "Algunos PVCs no están bound aún"

# Paso 7: Desplegar MySQL
header "PASO 7: DESPLEGAR BASE DE DATOS MySQL"

info "Desplegando MySQL StatefulSet..."
kubectl apply -f kubernetes/database/service.yaml
kubectl apply -f kubernetes/database/statefulset.yaml
success "MySQL desplegado"

info "Esperando a que MySQL esté listo (esto puede tardar 1-2 minutos)..."
kubectl wait --for=condition=Ready pod/mysql-0 -n $NAMESPACE --timeout=300s
success "MySQL está listo"

# Paso 8: Inicializar base de datos
header "PASO 8: INICIALIZAR BASES DE DATOS"

info "Ejecutando job de inicialización..."
kubectl apply -f kubernetes/jobs/init-database-job.yaml

info "Esperando a que el job de inicialización complete..."
kubectl wait --for=condition=complete job/init-database -n $NAMESPACE --timeout=120s
success "Bases de datos inicializadas"

warning "NOTA: Los schemas SQL deben importarse manualmente. Ver documentación."

# Paso 9: Crear cuenta admin
header "PASO 9: CREAR CUENTA DE ADMINISTRADOR"

info "Ejecutando job de creación de cuenta admin..."
kubectl delete job create-admin-account -n $NAMESPACE 2>/dev/null || true
kubectl apply -f kubernetes/jobs/create-admin-account-job.yaml

info "Esperando a que el job complete..."
kubectl wait --for=condition=complete job/create-admin-account -n $NAMESPACE --timeout=60s
success "Cuenta admin creada"

info "Mostrando logs del job..."
kubectl logs -n $NAMESPACE job/create-admin-account

# Paso 9.5: Actualizar realmlist
header "PASO 9.5: ACTUALIZAR REALMLIST"

info "Actualizando realmlist con IP del nodo..."
kubectl delete job update-realmlist -n $NAMESPACE 2>/dev/null || true
kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml

info "Esperando a que el job complete..."
kubectl wait --for=condition=complete job/update-realmlist -n $NAMESPACE --timeout=60s
success "Realmlist actualizado"

info "Mostrando configuración..."
kubectl logs -n $NAMESPACE job/update-realmlist

# Paso 10: Desplegar realmd
header "PASO 10: DESPLEGAR SERVIDOR DE AUTENTICACIÓN (realmd)"

info "Desplegando realmd con hostPort (puertos estándar)..."
kubectl apply -f kubernetes/realmd/service-hostport.yaml
kubectl apply -f kubernetes/realmd/deployment-hostport.yaml
success "Realmd desplegado"

info "Esperando a que realmd esté listo..."
kubectl wait --for=condition=Available deployment/realmd -n $NAMESPACE --timeout=120s
success "Realmd está listo en puerto 3724"

# Paso 11: Desplegar mangosd
header "PASO 11: DESPLEGAR SERVIDOR DE JUEGO (mangosd)"

info "Desplegando mangosd con hostPort (puertos estándar)..."
kubectl apply -f kubernetes/mangosd/deployment-hostport.yaml
success "Mangosd desplegado"

info "Esperando a que mangosd esté listo..."
kubectl wait --for=condition=Available deployment/mangosd -n $NAMESPACE --timeout=180s || warning "Mangosd puede tardar en estar listo si faltan los datos del juego"
success "Mangosd está listo en puerto 8085"

# Paso 12: Mostrar información
header "DESPLIEGUE COMPLETADO"

echo ""
success "¡mangos-classic desplegado exitosamente en k3s!"
echo ""

info "Información de servicios:"
kubectl get svc -n $NAMESPACE

echo ""
info "Información de pods:"
kubectl get pods -n $NAMESPACE

echo ""
info "Información de PVCs:"
kubectl get pvc -n $NAMESPACE

echo ""
warning "PRÓXIMOS PASOS:"
echo "  1. Copiar datos del juego (dbc, maps, vmaps, mmaps) al servidor"
echo "     POD=\$(kubectl get pod -n $NAMESPACE -l app=mangosd -o jsonpath='{.items[0].metadata.name}')"
echo "     kubectl cp /ruta/a/dbc $NAMESPACE/\${POD}:/mangos/data/dbc"
echo "     kubectl cp /ruta/a/maps $NAMESPACE/\${POD}:/mangos/data/maps"
echo "     kubectl cp /ruta/a/vmaps $NAMESPACE/\${POD}:/mangos/data/vmaps"
echo "     kubectl cp /ruta/a/mmaps $NAMESPACE/\${POD}:/mangos/data/mmaps"
echo ""
echo "  2. Importar schemas SQL a la base de datos"
echo "     kubectl exec -it mysql-0 -n $NAMESPACE -- bash"
echo "     # Luego ejecutar los scripts SQL"
echo ""
echo "  3. Descargar e importar classic-db (base de datos del mundo)"
echo "     Ver: https://github.com/cmangos/classic-db"
echo ""
echo "  4. Verificar conectividad:"
echo "     ./check-connectivity.sh"
echo ""
echo "  5. Configurar cliente WoW 1.12.1:"
# Obtener IP del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "     Editar realmlist.wtf:"
echo "     set realmlist $NODE_IP"
echo ""

info "Para ver logs:"
echo "  realmd:  kubectl logs -f -n $NAMESPACE -l app=realmd"
echo "  mangosd: kubectl logs -f -n $NAMESPACE -l app=mangosd"
echo "  mysql:   kubectl logs -f -n $NAMESPACE mysql-0"

echo ""
info "Credenciales por defecto:"
echo "  Usuario: admin"
echo "  Contraseña: admin"
echo "  GM Level: 3 (Administrador)"

echo ""
warning "SEGURIDAD: Cambia todas las contraseñas antes de usar en producción"

echo ""
success "═══════════════════════════════════════════════════════════════"
