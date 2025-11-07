#!/bin/bash

###############################################################################
# Script de verificación de conectividad para mangos-classic en k3s
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

header "VERIFICACIÓN DE CONECTIVIDAD - MANGOS-CLASSIC"

# Verificar kubectl
if ! command -v kubectl &> /dev/null; then
    error "kubectl no está instalado"
    exit 1
fi

# Verificar namespace existe
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    error "Namespace $NAMESPACE no existe. ¿Ejecutaste el despliegue?"
    exit 1
fi

# Obtener IP del nodo
header "PASO 1: OBTENER IP DEL NODO"

NODE_NAME=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
NODE_IP_EXTERNAL=$(kubectl get node $NODE_NAME -o jsonpath='{.status.addresses[?(@.type=="ExternalIP")].address}')
NODE_IP_INTERNAL=$(kubectl get node $NODE_NAME -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}')

if [ -z "$NODE_IP_EXTERNAL" ]; then
    NODE_IP=$NODE_IP_INTERNAL
    info "Usando IP interna del nodo: $NODE_IP"
else
    NODE_IP=$NODE_IP_EXTERNAL
    success "Usando IP externa del nodo: $NODE_IP"
fi

echo "  Nodo: $NODE_NAME"
echo "  IP Externa: ${NODE_IP_EXTERNAL:-N/A}"
echo "  IP Interna: $NODE_IP_INTERNAL"

# Verificar pods
header "PASO 2: VERIFICAR PODS"

info "Verificando pod de MySQL..."
MYSQL_POD=$(kubectl get pod -n $NAMESPACE -l app=mysql -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$MYSQL_POD" ]; then
    MYSQL_STATUS=$(kubectl get pod -n $NAMESPACE $MYSQL_POD -o jsonpath='{.status.phase}')
    if [ "$MYSQL_STATUS" = "Running" ]; then
        success "MySQL pod está corriendo: $MYSQL_POD"
    else
        warning "MySQL pod existe pero estado es: $MYSQL_STATUS"
    fi
else
    error "No se encontró pod de MySQL"
fi

info "Verificando pod de realmd..."
REALMD_POD=$(kubectl get pod -n $NAMESPACE -l app=realmd -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$REALMD_POD" ]; then
    REALMD_STATUS=$(kubectl get pod -n $NAMESPACE $REALMD_POD -o jsonpath='{.status.phase}')
    if [ "$REALMD_STATUS" = "Running" ]; then
        success "Realmd pod está corriendo: $REALMD_POD"
    else
        warning "Realmd pod existe pero estado es: $REALMD_STATUS"
    fi
else
    error "No se encontró pod de realmd"
fi

info "Verificando pod de mangosd..."
MANGOSD_POD=$(kubectl get pod -n $NAMESPACE -l app=mangosd -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$MANGOSD_POD" ]; then
    MANGOSD_STATUS=$(kubectl get pod -n $NAMESPACE $MANGOSD_POD -o jsonpath='{.status.phase}')
    if [ "$MANGOSD_STATUS" = "Running" ]; then
        success "Mangosd pod está corriendo: $MANGOSD_POD"
    else
        warning "Mangosd pod existe pero estado es: $MANGOSD_STATUS"
    fi
else
    error "No se encontró pod de mangosd"
fi

# Verificar servicios
header "PASO 3: VERIFICAR SERVICIOS"

info "Servicios en namespace $NAMESPACE:"
kubectl get svc -n $NAMESPACE

# Obtener tipo de servicio y puertos
REALMD_SVC_TYPE=$(kubectl get svc realmd-service -n $NAMESPACE -o jsonpath='{.spec.type}' 2>/dev/null || echo "N/A")
MANGOSD_SVC_TYPE=$(kubectl get svc mangosd-service -n $NAMESPACE -o jsonpath='{.spec.type}' 2>/dev/null || echo "N/A")

echo ""
info "Tipo de servicio realmd: $REALMD_SVC_TYPE"
info "Tipo de servicio mangosd: $MANGOSD_SVC_TYPE"

# Determinar puertos según tipo de servicio
if [ "$REALMD_SVC_TYPE" = "NodePort" ]; then
    REALMD_PORT=$(kubectl get svc realmd-service -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
    info "Puerto NodePort de realmd: $REALMD_PORT"
elif [ "$REALMD_SVC_TYPE" = "LoadBalancer" ]; then
    REALMD_PORT=3724
    REALMD_LB_IP=$(kubectl get svc realmd-loadbalancer -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$REALMD_LB_IP" ]; then
        NODE_IP=$REALMD_LB_IP
        success "LoadBalancer IP para realmd: $REALMD_LB_IP"
    fi
else
    # Asumir hostPort o verificar deployment
    REALMD_PORT=3724
    info "Verificando si realmd usa hostPort..."
    HAS_HOSTPORT=$(kubectl get deployment realmd -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].ports[0].hostPort}' 2>/dev/null)
    if [ -n "$HAS_HOSTPORT" ]; then
        success "Realmd está usando hostPort: $HAS_HOSTPORT"
        REALMD_PORT=$HAS_HOSTPORT
    fi
fi

if [ "$MANGOSD_SVC_TYPE" = "NodePort" ]; then
    MANGOSD_PORT=$(kubectl get svc mangosd-service -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
    info "Puerto NodePort de mangosd: $MANGOSD_PORT"
elif [ "$MANGOSD_SVC_TYPE" = "LoadBalancer" ]; then
    MANGOSD_PORT=8085
    MANGOSD_LB_IP=$(kubectl get svc mangosd-loadbalancer -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$MANGOSD_LB_IP" ]; then
        info "LoadBalancer IP para mangosd: $MANGOSD_LB_IP"
    fi
else
    MANGOSD_PORT=8085
    HAS_HOSTPORT=$(kubectl get deployment mangosd -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].ports[0].hostPort}' 2>/dev/null)
    if [ -n "$HAS_HOSTPORT" ]; then
        success "Mangosd está usando hostPort: $HAS_HOSTPORT"
        MANGOSD_PORT=$HAS_HOSTPORT
    fi
fi

# Probar conectividad
header "PASO 4: PROBAR CONECTIVIDAD"

info "Probando conectividad a realmd (puerto $REALMD_PORT)..."
if timeout 5 bash -c "echo >/dev/tcp/$NODE_IP/$REALMD_PORT" 2>/dev/null; then
    success "¡Conexión exitosa a realmd en $NODE_IP:$REALMD_PORT!"
else
    error "No se puede conectar a realmd en $NODE_IP:$REALMD_PORT"
    warning "Verifica que el pod esté corriendo y que el firewall permita la conexión"
fi

info "Probando conectividad a mangosd (puerto $MANGOSD_PORT)..."
if timeout 5 bash -c "echo >/dev/tcp/$NODE_IP/$MANGOSD_PORT" 2>/dev/null; then
    success "¡Conexión exitosa a mangosd en $NODE_IP:$MANGOSD_PORT!"
else
    error "No se puede conectar a mangosd en $NODE_IP:$MANGOSD_PORT"
    warning "Verifica que el pod esté corriendo y que el firewall permita la conexión"
fi

# Verificar realmlist en DB
header "PASO 5: VERIFICAR CONFIGURACIÓN DE REALMLIST"

info "Consultando realmlist en la base de datos..."
REALMLIST=$(kubectl exec -n $NAMESPACE $MYSQL_POD -- mysql -u mangos -pmangos_secure_password classicrealmd -e "SELECT id, name, address, port FROM realmlist;" -s 2>/dev/null || echo "ERROR")

if [ "$REALMLIST" != "ERROR" ]; then
    success "Configuración de realmlist en DB:"
    echo "$REALMLIST" | column -t

    # Verificar si la IP es correcta
    DB_IP=$(echo "$REALMLIST" | tail -n 1 | awk '{print $3}')
    DB_PORT=$(echo "$REALMLIST" | tail -n 1 | awk '{print $4}')

    if [ "$DB_IP" = "$NODE_IP" ]; then
        success "La IP en realmlist ($DB_IP) coincide con la IP del nodo"
    else
        warning "La IP en realmlist ($DB_IP) NO coincide con la IP del nodo ($NODE_IP)"
        warning "Ejecuta: kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml"
    fi

    if [ "$DB_PORT" = "$MANGOSD_PORT" ]; then
        success "El puerto en realmlist ($DB_PORT) es correcto"
    else
        warning "El puerto en realmlist ($DB_PORT) NO coincide con el puerto de mangosd ($MANGOSD_PORT)"
    fi
else
    error "No se pudo consultar el realmlist"
fi

# Resumen final
header "RESUMEN DE CONECTIVIDAD"

echo ""
success "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📍 IP DEL SERVIDOR: $NODE_IP"
echo ""
echo "  🔐 SERVIDOR DE AUTENTICACIÓN (realmd):"
echo "     Puerto: $REALMD_PORT"
echo "     Estado: $(kubectl get pod -n $NAMESPACE $REALMD_POD -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Unknown')"
echo ""
echo "  🎮 SERVIDOR DE JUEGO (mangosd):"
echo "     Puerto: $MANGOSD_PORT"
echo "     Estado: $(kubectl get pod -n $NAMESPACE $MANGOSD_POD -o jsonpath='{.status.phase}' 2>/dev/null || echo 'Unknown')"
echo ""
success "═══════════════════════════════════════════════════════════════"
echo ""

# Instrucciones para el cliente
header "CONFIGURACIÓN DEL CLIENTE WoW"

echo "1. Edita el archivo realmlist.wtf en tu directorio de WoW:"
echo ""
if [ "$REALMD_PORT" = "3724" ]; then
    echo "   set realmlist $NODE_IP"
else
    echo "   set realmlist $NODE_IP"
    echo "   set patchlist $NODE_IP:$REALMD_PORT"
    warning "   NOTA: El puerto no es el estándar (3724), puede requerir configuración adicional"
fi
echo ""
echo "2. Inicia World of Warcraft 1.12.1"
echo ""
echo "3. Credenciales de login:"
echo "   Usuario: admin"
echo "   Contraseña: admin"
echo ""

# Troubleshooting
if [ "$REALMD_PORT" != "3724" ] || [ "$MANGOSD_PORT" != "8085" ]; then
    warning "═══════════════════════════════════════════════════════════════"
    warning "IMPORTANTE: Estás usando puertos no estándar"
    warning "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Para usar los puertos estándar (3724 y 8085):"
    echo "1. Usa los deployments con hostPort:"
    echo "   kubectl apply -f kubernetes/realmd/deployment-hostport.yaml"
    echo "   kubectl apply -f kubernetes/mangosd/deployment-hostport.yaml"
    echo ""
    echo "2. O configura un LoadBalancer con metallb"
    echo ""
fi

# Logs útiles
header "COMANDOS ÚTILES"

echo "Ver logs de realmd:"
echo "  kubectl logs -f -n $NAMESPACE $REALMD_POD"
echo ""
echo "Ver logs de mangosd:"
echo "  kubectl logs -f -n $NAMESPACE $MANGOSD_POD"
echo ""
echo "Actualizar realmlist automáticamente:"
echo "  kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml"
echo ""
echo "Ver eventos del namespace:"
echo "  kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
echo ""

success "═══════════════════════════════════════════════════════════════"
success "  VERIFICACIÓN COMPLETADA"
success "═══════════════════════════════════════════════════════════════"
