# 🚀 Inicio Rápido - Despliegue en k3s

## ⚡ Despliegue en 3 Pasos

### 1️⃣ Instalar k3s (si no está instalado)

```bash
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

### 2️⃣ Clonar y desplegar

```bash
git clone https://github.com/TU_USUARIO/mangos-classic.git
cd mangos-classic
./deploy-k3s.sh
```

### 3️⃣ Copiar datos del cliente

```bash
# Obtener nombre del pod de mangosd
POD=$(kubectl get pod -n mangos-classic -l app=mangosd -o jsonpath='{.items[0].metadata.name}')

# Copiar datos extraídos del cliente WoW
kubectl cp /ruta/a/dbc mangos-classic/${POD}:/mangos/data/dbc
kubectl cp /ruta/a/maps mangos-classic/${POD}:/mangos/data/maps
kubectl cp /ruta/a/vmaps mangos-classic/${POD}:/mangos/data/vmaps
kubectl cp /ruta/a/mmaps mangos-classic/${POD}:/mangos/data/mmaps
```

---

## 🎮 Conectar Cliente WoW

### 1. Obtener IP del nodo

```bash
kubectl get nodes -o wide
# Anota la IP EXTERNAL-IP o INTERNAL-IP
```

### 2. Configurar realmlist.wtf

```
set realmlist <IP_DEL_NODO>
```

### 3. Iniciar WoW 1.12.1

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin`

---

## 📊 Ver Estado

```bash
# Pods
kubectl get pods -n mangos-classic

# Servicios
kubectl get svc -n mangos-classic

# Logs de mangosd
kubectl logs -f -n mangos-classic -l app=mangosd

# Logs de realmd
kubectl logs -f -n mangos-classic -l app=realmd
```

---

## ⚙️ Configuración Avanzada

### Cambiar configuración del servidor

```bash
# Editar configuración de mangosd
kubectl edit configmap mangosd-config -n mangos-classic

# Editar configuración de playerbots
kubectl edit configmap playerbot-config -n mangos-classic

# Aplicar cambios (reiniciar pod)
kubectl rollout restart deployment/mangosd -n mangos-classic
```

### Importar Classic-DB (mundo)

```bash
# Exponer MySQL temporalmente
kubectl port-forward -n mangos-classic mysql-0 3306:3306 &

# Clonar classic-db
git clone https://github.com/cmangos/classic-db.git
cd classic-db

# Configurar
nano InstallFullDB.config
# MYSQL_HOST="localhost"
# MYSQL_PORT="3306"
# MYSQL_USERNAME="mangos"
# MYSQL_PASSWORD="<password>"
# MYSQL_DATABASE="classicmangos"

# Importar
./InstallFullDB.sh
```

### Escalar realmd (múltiples replicas)

```bash
kubectl scale deployment realmd --replicas=3 -n mangos-classic
```

---

## 🔧 Troubleshooting

### Pod no inicia

```bash
kubectl describe pod <POD_NAME> -n mangos-classic
kubectl logs <POD_NAME> -n mangos-classic
```

### MySQL no conecta

```bash
# Verificar MySQL está corriendo
kubectl get pods -n mangos-classic | grep mysql

# Probar conexión
kubectl run -it --rm mysql-test --image=mysql:8.0 -n mangos-classic -- \
  mysql -h mysql-service -u mangos -p
```

### No aparecen datos del juego

```bash
# Verificar que los datos fueron copiados
POD=$(kubectl get pod -n mangos-classic -l app=mangosd -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n mangos-classic ${POD} -- ls -la /mangos/data/

# Debe mostrar: dbc/, maps/, vmaps/, mmaps/
```

---

## 🔄 Actualizar

```bash
# Actualizar código
git pull

# Reconstruir imágenes
./deploy-k3s.sh

# O manualmente:
docker build -t mangos-classic/mangosd:latest -f docker/mangosd/Dockerfile .
kubectl rollout restart deployment/mangosd -n mangos-classic
```

---

## 🗑️ Eliminar Todo

```bash
# Eliminar namespace completo (¡CUIDADO! Borra todo)
kubectl delete namespace mangos-classic

# Los PVCs persistentes también se eliminan
# Haz backup antes si necesitas los datos
```

---

## 📚 Documentación Completa

Ver **[KUBERNETES_DEPLOYMENT.md](KUBERNETES_DEPLOYMENT.md)** para:
- Arquitectura detallada
- Despliegue paso a paso
- Alta disponibilidad
- Monitoreo
- Mantenimiento
- Y mucho más...

---

## 🆘 Ayuda

- **Documentación k3s:** https://docs.k3s.io/
- **CMaNGOS Discord:** https://discord.gg/Dgzerzb
- **GitHub Issues:** https://github.com/cmangos/issues/issues

---

**Tiempo de despliegue:** ~15 minutos
**Requisitos mínimos:** 2 CPU, 8GB RAM, 30GB almacenamiento
