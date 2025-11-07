# 🚀 Guía de Despliegue en Kubernetes (k3s)

Esta guía completa te ayudará a desplegar mangos-classic en un cluster k3s con soporte completo para **Playerbots**.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Despliegue Rápido](#despliegue-rápido)
- [Despliegue Manual Paso a Paso](#despliegue-manual-paso-a-paso)
- [Configuración](#configuración)
- [Gestión de Datos](#gestión-de-datos)
- [Escalado y Alta Disponibilidad](#escalado-y-alta-disponibilidad)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Troubleshooting](#troubleshooting)
- [Mantenimiento](#mantenimiento)

---

## 🏗️ Arquitectura

### Componentes del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLUSTER K3S                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Namespace: mangos-classic                              │   │
│  │                                                          │   │
│  │  ┌──────────────┐     ┌───────────────────┐           │   │
│  │  │   realmd     │────►│  realmd-service   │           │   │
│  │  │  Deployment  │     │    NodePort       │           │   │
│  │  │              │     │    30724          │◄──────────┼───┼─ Cliente WoW
│  │  └──────────────┘     └───────────────────┘           │   │   (Auth 3724)
│  │                                                          │   │
│  │  ┌──────────────┐     ┌───────────────────┐           │   │
│  │  │  mangosd     │────►│  mangosd-service  │           │   │
│  │  │  Deployment  │     │    NodePort       │           │   │
│  │  │ +Playerbots  │     │    30085          │◄──────────┼───┼─ Cliente WoW
│  │  └──────────────┘     └───────────────────┘           │   │   (Game 8085)
│  │        │                                                │   │
│  │        └──────────┐                                    │   │
│  │                    ▼                                    │   │
│  │  ┌──────────────────────────────────┐                 │   │
│  │  │         MySQL StatefulSet        │                 │   │
│  │  │  ┌───────────────────────────┐  │                 │   │
│  │  │  │  classicmangos (world)    │  │                 │   │
│  │  │  │  classiccharacters        │  │                 │   │
│  │  │  │  classicrealmd (auth)     │  │                 │   │
│  │  │  │  classiclogs              │  │                 │   │
│  │  │  └───────────────────────────┘  │                 │   │
│  │  │         PVC: 10Gi                │                 │   │
│  │  └──────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────┐                 │   │
│  │  │  PVC: game-data (10Gi)           │                 │   │
│  │  │  - dbc/                           │                 │   │
│  │  │  - maps/                          │                 │   │
│  │  │  - vmaps/                         │                 │   │
│  │  │  - mmaps/                         │                 │   │
│  │  └──────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────┐                 │   │
│  │  │  ConfigMaps & Secrets            │                 │   │
│  │  │  - realmd.conf                    │                 │   │
│  │  │  - mangosd.conf                   │                 │   │
│  │  │  - playerbot.conf                 │                 │   │
│  │  │  - database credentials           │                 │   │
│  │  └──────────────────────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Recursos de Kubernetes

| Recurso | Tipo | Propósito |
|---------|------|-----------|
| `mysql` | StatefulSet | Base de datos con almacenamiento persistente |
| `realmd` | Deployment | Servidor de autenticación (escalable) |
| `mangosd` | Deployment | Servidor de juego con Playerbots |
| `mysql-service` | Service (ClusterIP) | Servicio interno de base de datos |
| `realmd-service` | Service (NodePort) | Acceso externo a auth (puerto 30724) |
| `mangosd-service` | Service (NodePort) | Acceso externo a game (puerto 30085) |
| `game-data-pvc` | PVC | Almacenamiento de datos del cliente (10Gi) |
| `mysql-data-pvc` | PVC | Almacenamiento de base de datos (10Gi) |
| `server-logs-pvc` | PVC | Logs del servidor (5Gi) |

---

## 🔧 Requisitos

### Cluster k3s

**Mínimo:**
- k3s v1.25+
- 2 CPU cores
- 8GB RAM
- 30GB almacenamiento

**Recomendado:**
- k3s v1.28+
- 4 CPU cores
- 16GB RAM
- 50GB almacenamiento SSD

### Software Local

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Docker (para construir imágenes)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# k3s (si no está instalado)
curl -sfL https://get.k3s.io | sh -
```

### Cliente WoW

- World of Warcraft 1.12.1 (Vanilla)
- Datos extraídos: dbc, maps, vmaps, mmaps (~5GB)

---

## 🚀 Despliegue Rápido

### Opción 1: Script Automatizado (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/mangos-classic.git
cd mangos-classic

# Ejecutar script de despliegue
./deploy-k3s.sh
```

El script realiza:
1. ✅ Construye imágenes Docker
2. ✅ Crea namespace y secrets
3. ✅ Despliega MySQL con inicialización
4. ✅ Despliega realmd y mangosd
5. ✅ Crea cuenta admin por defecto
6. ✅ Muestra información de conexión

**Tiempo estimado:** 10-15 minutos

### Opción 2: Kustomize

```bash
cd mangos-classic

# Aplicar toda la configuración
kubectl apply -k kubernetes/

# Crear cuenta admin
kubectl apply -f kubernetes/jobs/create-admin-account-job.yaml
```

---

## 📝 Despliegue Manual Paso a Paso

### Paso 1: Construir Imágenes Docker

```bash
cd mangos-classic

# Imagen builder (contiene binarios compilados)
docker build -t mangos-classic/builder:latest -f docker/builder/Dockerfile .

# Imagen de base de datos
docker build -t mangos-classic/database:latest -f docker/database/Dockerfile .

# Imagen realmd
docker build -t mangos-classic/realmd:latest -f docker/realmd/Dockerfile .

# Imagen mangosd
docker build -t mangos-classic/mangosd:latest -f docker/mangosd/Dockerfile .
```

**Nota:** Para k3s, las imágenes deben estar disponibles localmente o en un registry accesible.

#### Importar imágenes a k3s

```bash
# Guardar imágenes
docker save mangos-classic/realmd:latest | sudo k3s ctr images import -
docker save mangos-classic/mangosd:latest | sudo k3s ctr images import -
docker save mangos-classic/database:latest | sudo k3s ctr images import -
```

### Paso 2: Crear Namespace

```bash
kubectl apply -f kubernetes/base/namespace.yaml
```

### Paso 3: Configurar Secrets

**IMPORTANTE:** Edita las contraseñas antes de aplicar:

```bash
# Editar secrets
nano kubernetes/secrets/database-secrets.yaml

# Cambiar estos valores:
# - mysql-root-password
# - mysql-password

# Aplicar
kubectl apply -f kubernetes/secrets/database-secrets.yaml
```

### Paso 4: Aplicar ConfigMaps

```bash
kubectl apply -f kubernetes/configmaps/realmd-config.yaml
kubectl apply -f kubernetes/configmaps/mangosd-config.yaml
kubectl apply -f kubernetes/configmaps/playerbot-config.yaml
```

### Paso 5: Crear Volúmenes Persistentes

```bash
kubectl apply -f kubernetes/storage/persistent-volumes.yaml

# Verificar estado
kubectl get pvc -n mangos-classic
```

### Paso 6: Desplegar MySQL

```bash
# Aplicar servicio y StatefulSet
kubectl apply -f kubernetes/database/service.yaml
kubectl apply -f kubernetes/database/statefulset.yaml

# Esperar a que esté listo
kubectl wait --for=condition=Ready pod/mysql-0 -n mangos-classic --timeout=300s

# Verificar
kubectl get pods -n mangos-classic
```

### Paso 7: Inicializar Base de Datos

```bash
# Ejecutar job de inicialización
kubectl apply -f kubernetes/jobs/init-database-job.yaml

# Ver progreso
kubectl logs -f job/init-database -n mangos-classic

# Esperar a que complete
kubectl wait --for=condition=complete job/init-database -n mangos-classic --timeout=120s
```

### Paso 8: Importar Schemas SQL

Las bases de datos están creadas, pero necesitas importar los schemas:

```bash
# Copiar archivos SQL al pod de MySQL
kubectl cp sql/base/mangos.sql mangos-classic/mysql-0:/tmp/

# Conectar a MySQL
kubectl exec -it mysql-0 -n mangos-classic -- bash

# Dentro del pod:
mysql -u root -p

# Importar schemas
USE classicmangos;
SOURCE /tmp/mangos.sql;

# Repetir para characters, realmd, logs
```

**O usar el script setup-database.ps1 desde un pod temporal:**

```bash
# Crear pod temporal con acceso a MySQL
kubectl run -it --rm mysql-client --image=mysql:8.0 -n mangos-classic -- bash

# Dentro del pod, ejecutar scripts SQL
```

### Paso 9: Importar Classic-DB (Datos del Mundo)

```bash
# Clonar classic-db
git clone https://github.com/cmangos/classic-db.git
cd classic-db

# Configurar InstallFullDB.config
nano InstallFullDB.config

# Editar:
MYSQL_HOST="<IP_DEL_NODO_K3S>"
MYSQL_PORT="30306"  # Si expones MySQL externamente
MYSQL_USERNAME="mangos"
MYSQL_PASSWORD="<TU_PASSWORD>"
MYSQL_DATABASE="classicmangos"

# Ejecutar instalador
./InstallFullDB.sh
```

### Paso 10: Crear Cuenta Admin

```bash
kubectl apply -f kubernetes/jobs/create-admin-account-job.yaml

# Ver resultado
kubectl logs job/create-admin-account -n mangos-classic
```

**Credenciales creadas:**
- Usuario: `admin`
- Contraseña: `admin`
- GM Level: 3 (Administrador)

### Paso 11: Copiar Datos del Cliente

Necesitas copiar los datos extraídos del cliente al volumen `game-data-pvc`:

```bash
# Obtener nombre del pod de mangosd
MANGOSD_POD=$(kubectl get pod -n mangos-classic -l app=mangosd -o jsonpath='{.items[0].metadata.name}')

# Copiar datos
kubectl cp /ruta/local/dbc mangos-classic/${MANGOSD_POD}:/mangos/data/dbc
kubectl cp /ruta/local/maps mangos-classic/${MANGOSD_POD}:/mangos/data/maps
kubectl cp /ruta/local/vmaps mangos-classic/${MANGOSD_POD}:/mangos/data/vmaps
kubectl cp /ruta/local/mmaps mangos-classic/${MANGOSD_POD}:/mangos/data/mmaps

# Verificar
kubectl exec -n mangos-classic ${MANGOSD_POD} -- ls -lh /mangos/data/
```

### Paso 12: Desplegar Realmd

```bash
kubectl apply -f kubernetes/realmd/service.yaml
kubectl apply -f kubernetes/realmd/deployment.yaml

# Esperar
kubectl wait --for=condition=Available deployment/realmd -n mangos-classic --timeout=120s

# Verificar
kubectl get pods -n mangos-classic -l app=realmd
```

### Paso 13: Desplegar Mangosd

```bash
kubectl apply -f kubernetes/mangosd/service.yaml
kubectl apply -f kubernetes/mangosd/deployment.yaml

# Esperar
kubectl wait --for=condition=Available deployment/mangosd -n mangos-classic --timeout=180s

# Verificar
kubectl get pods -n mangos-classic -l app=mangosd
```

### Paso 14: Actualizar Realmlist en DB

```bash
# Obtener IP externa del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

# Si no hay ExternalIP, usar InternalIP
[ -z "$NODE_IP" ] && NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo "IP del nodo: $NODE_IP"

# Conectar a MySQL y actualizar realmlist
kubectl exec -it mysql-0 -n mangos-classic -- mysql -u mangos -p classicrealmd

# En MySQL:
UPDATE realmlist SET address = '<NODE_IP>' WHERE id = 1;

# Si no existe un realm:
INSERT INTO realmlist (name, address, port, icon, realmflags, timezone, allowedSecurityLevel)
VALUES ('mangos-classic', '<NODE_IP>', 8085, 0, 0, 1, 0);
```

### Paso 15: Conectar con Cliente WoW

1. **Editar realmlist.wtf:**
   ```
   set realmlist <NODE_IP>
   ```

2. **Iniciar WoW 1.12.1**

3. **Login:**
   - Usuario: `admin`
   - Contraseña: `admin`

4. **¡Jugar!**

---

## ⚙️ Configuración

### Cambiar Configuración del Servidor

#### Realmd

```bash
kubectl edit configmap realmd-config -n mangos-classic

# O editar archivo y reaplicar
nano kubernetes/configmaps/realmd-config.yaml
kubectl apply -f kubernetes/configmaps/realmd-config.yaml

# Reiniciar deployment
kubectl rollout restart deployment/realmd -n mangos-classic
```

#### Mangosd

```bash
kubectl edit configmap mangosd-config -n mangos-classic

# Reiniciar
kubectl rollout restart deployment/mangosd -n mangos-classic
```

#### Playerbots

```bash
kubectl edit configmap playerbot-config -n mangos-classic
kubectl rollout restart deployment/mangosd -n mangos-classic
```

### Cambiar Recursos de CPU/RAM

```bash
# Editar deployment
kubectl edit deployment mangosd -n mangos-classic

# Modificar resources:
spec:
  template:
    spec:
      containers:
      - name: mangosd
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
          limits:
            memory: "16Gi"
            cpu: "8000m"
```

---

## 💾 Gestión de Datos

### Backups de Base de Datos

```bash
# Crear backup completo
kubectl exec mysql-0 -n mangos-classic -- mysqldump \
  -u root -p<PASSWORD> --all-databases \
  > mangos-backup-$(date +%Y%m%d).sql

# Backup específico
kubectl exec mysql-0 -n mangos-classic -- mysqldump \
  -u mangos -p<PASSWORD> classicmangos \
  > world-backup-$(date +%Y%m%d).sql
```

### Restaurar Backup

```bash
kubectl cp backup.sql mangos-classic/mysql-0:/tmp/

kubectl exec -it mysql-0 -n mangos-classic -- \
  mysql -u root -p < /tmp/backup.sql
```

### Backup de PVCs

```bash
# Crear snapshot del PVC (si tu storage class lo soporta)
kubectl get volumesnapshot -n mangos-classic

# O copiar datos manualmente
kubectl exec mysql-0 -n mangos-classic -- \
  tar czf /tmp/mysql-data.tar.gz /var/lib/mysql

kubectl cp mangos-classic/mysql-0:/tmp/mysql-data.tar.gz ./mysql-backup.tar.gz
```

---

## 📈 Escalado y Alta Disponibilidad

### Escalar Realmd (Múltiples Replicas)

```bash
# Escalar a 2 replicas
kubectl scale deployment realmd --replicas=2 -n mangos-classic

# Con LoadBalancer automático
kubectl apply -f kubernetes/realmd/service.yaml  # Usar la versión con LoadBalancer
```

### Mangosd con Alta Disponibilidad

**Nota:** mangos-classic generalmente usa 1 servidor de juego por reino. Para múltiples reinos:

1. Crear múltiples deployments de mangosd (uno por reino)
2. Cada uno con su propia entrada en la tabla `realmlist`
3. Todos compartiendo la misma base de datos

### MySQL con Replicación

Para producción, considera usar un operador de MySQL como:
- **MySQL Operator for Kubernetes**
- **Vitess**
- **Percona XtraDB Cluster Operator**

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Realmd
kubectl logs -f -n mangos-classic -l app=realmd

# Mangosd
kubectl logs -f -n mangos-classic -l app=mangosd

# MySQL
kubectl logs -f -n mangos-classic mysql-0

# Todos los logs del namespace
kubectl logs -f -n mangos-classic --all-containers=true
```

### Logs Específicos de un Pod

```bash
# Listar pods
kubectl get pods -n mangos-classic

# Ver logs de un pod específico
kubectl logs mangosd-xxxx-yyyy -n mangos-classic

# Logs anteriores (si el pod crasheó)
kubectl logs mangosd-xxxx-yyyy -n mangos-classic --previous
```

### Métricas con kubectl top

```bash
# Uso de recursos de pods
kubectl top pods -n mangos-classic

# Uso de recursos de nodos
kubectl top nodes
```

### Integración con Prometheus/Grafana

Para monitoreo avanzado, instala Prometheus Operator:

```bash
# Instalar Prometheus Stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Agregar ServiceMonitors para mangos-classic (crear custom)
```

---

## 🔍 Troubleshooting

### Pod no inicia

```bash
# Ver estado
kubectl describe pod <POD_NAME> -n mangos-classic

# Ver eventos
kubectl get events -n mangos-classic --sort-by='.lastTimestamp'

# Ver logs
kubectl logs <POD_NAME> -n mangos-classic
```

### MySQL no se conecta

```bash
# Verificar que MySQL está corriendo
kubectl get pods -n mangos-classic | grep mysql

# Probar conexión desde otro pod
kubectl run -it --rm mysql-test --image=mysql:8.0 -n mangos-classic -- \
  mysql -h mysql-service -u mangos -p

# Verificar secrets
kubectl get secret database-secrets -n mangos-classic -o yaml
```

### Mangosd no encuentra datos

```bash
# Verificar que el PVC está montado
kubectl exec mangosd-xxxx -n mangos-classic -- ls -la /mangos/data/

# Debe mostrar:
# drwxr-xr-x dbc/
# drwxr-xr-x maps/
# drwxr-xr-x vmaps/
# drwxr-xr-x mmaps/

# Si falta, copiar datos
```

### Realmd no acepta conexiones

```bash
# Verificar puerto está expuesto
kubectl get svc realmd-service -n mangos-classic

# Debe mostrar NodePort 30724

# Probar conexión desde fuera
telnet <NODE_IP> 30724

# Verificar realmlist en DB
kubectl exec mysql-0 -n mangos-classic -- \
  mysql -u mangos -p classicrealmd -e "SELECT * FROM realmlist;"
```

### PVC no hace bind

```bash
# Ver estado de PVCs
kubectl get pvc -n mangos-classic

# Ver detalles
kubectl describe pvc game-data-pvc -n mangos-classic

# Ver PVs disponibles
kubectl get pv

# k3s usa local-path por defecto, debería funcionar automáticamente
```

### Errores de permisos en volúmenes

```bash
# Acceder al pod y verificar permisos
kubectl exec -it mangosd-xxxx -n mangos-classic -- bash

# Dentro del pod:
ls -la /mangos/data/
whoami  # Debe ser 'mangos' (uid 1000)

# Si hay problemas, ajustar securityContext en deployment
```

---

## 🔧 Mantenimiento

### Actualizar Imágenes

```bash
# Construir nuevas imágenes con nuevo tag
docker build -t mangos-classic/mangosd:v1.1 -f docker/mangosd/Dockerfile .

# Actualizar deployment
kubectl set image deployment/mangosd \
  mangosd=mangos-classic/mangosd:v1.1 \
  -n mangos-classic

# Verificar rollout
kubectl rollout status deployment/mangosd -n mangos-classic
```

### Aplicar Updates SQL

```bash
# Copiar scripts de update
kubectl cp sql/updates/mangos/ mangos-classic/mysql-0:/tmp/updates/

# Ejecutar updates
kubectl exec -it mysql-0 -n mangos-classic -- bash

# Dentro del pod:
for file in /tmp/updates/*.sql; do
  mysql -u mangos -p classicmangos < "$file"
done
```

### Reiniciar Servicios

```bash
# Reiniciar realmd
kubectl rollout restart deployment/realmd -n mangos-classic

# Reiniciar mangosd
kubectl rollout restart deployment/mangosd -n mangos-classic

# Reiniciar MySQL (cuidado, downtime!)
kubectl delete pod mysql-0 -n mangos-classic
# El StatefulSet lo recreará automáticamente
```

### Limpiar Recursos

```bash
# Eliminar todo el namespace (¡CUIDADO!)
kubectl delete namespace mangos-classic

# Eliminar solo pods (se recrean automáticamente)
kubectl delete pods --all -n mangos-classic

# Eliminar solo deployments
kubectl delete deployment realmd mangosd -n mangos-classic
```

---

## 📚 Recursos Adicionales

- **k3s Documentation:** https://docs.k3s.io/
- **Kubernetes Documentation:** https://kubernetes.io/docs/
- **CMaNGOS Wiki:** https://github.com/cmangos/issues/wiki
- **Docker Hub:** https://hub.docker.com/
- **Kustomize:** https://kustomize.io/

---

## 🆘 Obtener Ayuda

- **CMaNGOS Discord:** https://discord.gg/Dgzerzb
- **k3s Slack:** https://rancher-users.slack.com/
- **GitHub Issues:** https://github.com/cmangos/issues/issues

---

**Última actualización:** 2025-11-07
**Versión:** 1.0
**Mantenedor:** mangos-classic community
