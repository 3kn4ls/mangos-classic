# 🌐 Configuración de Red para mangos-classic en k3s

## 📡 Puertos Utilizados

mangos-classic utiliza **dos puertos TCP** que **DEBEN** estar accesibles desde Internet para que los clientes puedan conectar:

| Servicio | Puerto | Protocolo | Descripción |
|----------|--------|-----------|-------------|
| **realmd** | **3724** | TCP | Servidor de autenticación - Primera conexión del cliente |
| **mangosd** | **8085** | TCP | Servidor de juego - Conexión después de autenticación |

## 🔍 El Problema con NodePort

Por defecto, los servicios de Kubernetes con `type: NodePort` exponen puertos en el rango **30000-32767**:

- `realmd-service`: Puerto **30724** (no 3724)
- `mangosd-service`: Puerto **30085** (no 8085)

**❌ Esto NO funciona** con el cliente de WoW porque espera los puertos estándar (3724 y 8085).

---

## ✅ Soluciones Disponibles

### **Opción 1: hostPort (RECOMENDADA para k3s)**

Expone los puertos directamente en la interfaz del nodo, mapeando el puerto del contenedor al puerto del host.

**Ventajas:**
- ✅ Usa los puertos estándar (3724 y 8085)
- ✅ No requiere software adicional
- ✅ Funciona inmediatamente en k3s
- ✅ Fácil de configurar

**Desventajas:**
- ⚠️ Solo puedes tener 1 pod por nodo (porque el puerto está ocupado)
- ⚠️ Requiere privilegios de puerto (<1024 para puerto 80, pero >1024 para 3724 y 8085)

**Cómo usar:**

```bash
# Aplicar deployments con hostPort
kubectl apply -f kubernetes/realmd/deployment-hostport.yaml
kubectl apply -f kubernetes/mangosd/deployment-hostport.yaml

# Actualizar servicios (opcional, ya que hostPort no requiere Service para acceso externo)
kubectl apply -f kubernetes/realmd/service-hostport.yaml
kubectl apply -f kubernetes/mangosd/service-hostport.yaml
```

---

### **Opción 2: LoadBalancer con MetalLB**

Usa MetalLB para proporcionar IPs externas y mapear los puertos correctamente.

**Ventajas:**
- ✅ Usa puertos estándar
- ✅ Permite múltiples réplicas con balanceo de carga
- ✅ IP externa dedicada

**Desventajas:**
- ⚠️ Requiere instalar MetalLB
- ⚠️ Requiere configurar un pool de IPs

**Instalación de MetalLB:**

```bash
# Instalar MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml

# Esperar a que esté listo
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=90s

# Configurar pool de IPs (ajusta según tu red)
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.240-192.168.1.250  # Ajusta según tu red
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
spec:
  ipAddressPools:
  - default
EOF
```

**Usar servicios LoadBalancer:**

```bash
# Los servicios LoadBalancer ya están definidos
kubectl get svc -n mangos-classic

# Obtener IP asignada
REALMD_IP=$(kubectl get svc realmd-loadbalancer -n mangos-classic -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
MANGOSD_IP=$(kubectl get svc mangosd-loadbalancer -n mangos-classic -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Realmd IP: $REALMD_IP:3724"
echo "Mangosd IP: $MANGOSD_IP:8085"
```

---

### **Opción 3: Ingress TCP (k3s Traefik)**

k3s viene con Traefik que puede manejar TCP.

**Ventajas:**
- ✅ Usa la infraestructura existente de k3s
- ✅ Puede usar puertos estándar

**Desventajas:**
- ⚠️ Configuración más compleja
- ⚠️ Requiere modificar la configuración de Traefik

**Configuración:**

```yaml
# Editar ConfigMap de Traefik
apiVersion: v1
kind: ConfigMap
metadata:
  name: traefik-tcp
  namespace: kube-system
data:
  traefik.yaml: |
    tcp:
      routers:
        realmd:
          rule: "HostSNI(`*`)"
          service: realmd
          entryPoints:
            - realmd
        mangosd:
          rule: "HostSNI(`*`)"
          service: mangosd
          entryPoints:
            - mangosd
      services:
        realmd:
          loadBalancer:
            servers:
              - address: "realmd-service.mangos-classic.svc.cluster.local:3724"
        mangosd:
          loadBalancer:
            servers:
              - address: "mangosd-service.mangos-classic.svc.cluster.local:8085"
```

---

### **Opción 4: NodePort con Port Forwarding (Para pruebas)**

Usar port forwarding del router/firewall para mapear puertos externos a los NodePort.

**Ejemplo:**
- Router puerto 3724 → Nodo k3s puerto 30724
- Router puerto 8085 → Nodo k3s puerto 30085

**Solo para:**
- Pruebas locales
- Redes controladas

---

## 🎯 Configuración Recomendada

### Para Producción: **hostPort** o **MetalLB LoadBalancer**

```bash
# 1. Desplegar con hostPort (más simple)
kubectl apply -f kubernetes/realmd/deployment-hostport.yaml
kubectl apply -f kubernetes/mangosd/deployment-hostport.yaml

# 2. Verificar conectividad
./check-connectivity.sh

# 3. Actualizar realmlist en DB
kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml
```

### Para Desarrollo: **NodePort** está bien si haces port forwarding

```bash
kubectl port-forward -n mangos-classic svc/realmd-service 3724:3724 &
kubectl port-forward -n mangos-classic svc/mangosd-service 8085:8085 &
```

---

## 🔧 Actualizar Realmlist en Base de Datos

Después de exponer los servicios, **DEBES** actualizar la tabla `realmlist` en la base de datos con la IP correcta.

### Automático (Recomendado)

```bash
# Ejecutar job que actualiza automáticamente
kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml

# Ver resultado
kubectl logs -n mangos-classic job/update-realmlist
```

### Manual

```bash
# Obtener IP del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Conectar a MySQL
kubectl exec -it mysql-0 -n mangos-classic -- mysql -u mangos -p classicrealmd

# Actualizar realmlist
UPDATE realmlist SET address = '<NODE_IP>' WHERE id = 1;

# O crear si no existe
INSERT INTO realmlist (id, name, address, port, icon, realmflags, timezone, allowedSecurityLevel)
VALUES (1, 'mangos-classic', '<NODE_IP>', 8085, 0, 0, 1, 0);
```

---

## 🧪 Verificar Conectividad

### Script Automático

```bash
./check-connectivity.sh
```

Este script verifica:
- ✅ Estado de pods
- ✅ Configuración de servicios
- ✅ Puertos expuestos
- ✅ Conectividad TCP a realmd y mangosd
- ✅ Configuración de realmlist en DB
- ✅ Genera instrucciones para el cliente

### Manual

```bash
# Obtener IP del nodo
NODE_IP=$(kubectl get nodes -o wide | grep Ready | awk '{print $6}')

# Probar realmd (puerto 3724 con hostPort, 30724 con NodePort)
telnet $NODE_IP 3724  # o 30724 si usas NodePort

# Probar mangosd (puerto 8085 con hostPort, 30085 con NodePort)
telnet $NODE_IP 8085  # o 30085 si usas NodePort

# Verificar desde dentro del cluster
kubectl run -it --rm test --image=busybox -n mangos-classic -- sh
nc -zv realmd-service 3724
nc -zv mangosd-service 8085
```

---

## 📝 Configuración del Cliente WoW

### Con hostPort (Puertos Estándar)

```
# Archivo: realmlist.wtf
set realmlist <IP_DEL_NODO>
```

### Con NodePort (Puertos Personalizados)

El cliente WoW **NO soporta** puertos personalizados directamente en `realmlist.wtf`.

Necesitas una de estas soluciones:
1. Usar **hostPort** (recomendado)
2. Usar **LoadBalancer**
3. Hacer **port forwarding** en tu router
4. Modificar el cliente (no recomendado)

---

## 🔥 Firewall

Asegúrate de que el firewall del nodo permita conexiones a los puertos:

```bash
# En el nodo k3s (si usas firewalld)
sudo firewall-cmd --permanent --add-port=3724/tcp
sudo firewall-cmd --permanent --add-port=8085/tcp
sudo firewall-cmd --reload

# O con iptables
sudo iptables -A INPUT -p tcp --dport 3724 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8085 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4

# O con ufw
sudo ufw allow 3724/tcp
sudo ufw allow 8085/tcp
```

---

## 📊 Comparación de Opciones

| Característica | hostPort | NodePort | LoadBalancer | Ingress TCP |
|----------------|----------|----------|--------------|-------------|
| Puertos estándar | ✅ Sí | ❌ No | ✅ Sí | ✅ Sí |
| Fácil setup | ✅ Muy fácil | ✅ Muy fácil | ⚠️ Requiere MetalLB | ⚠️ Complejo |
| Múltiples réplicas | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| Requiere software extra | ❌ No | ❌ No | ✅ Sí (MetalLB) | ⚠️ Config Traefik |
| Recomendado para | Single-node k3s | Testing | Producción multi-node | Avanzado |

---

## 🆘 Troubleshooting

### Problema: Cliente no puede conectar a realmd

**Verificar:**
1. Pod realmd está corriendo: `kubectl get pods -n mangos-classic`
2. Puerto está expuesto: `./check-connectivity.sh`
3. Firewall permite conexión: `sudo firewall-cmd --list-ports`
4. IP correcta en realmlist.wtf

### Problema: Conecta a realmd pero no al servidor de juego

**Verificar:**
1. Pod mangosd está corriendo
2. Realmlist en DB tiene IP correcta: `kubectl exec mysql-0 -n mangos-classic -- mysql -u mangos -p classicrealmd -e "SELECT * FROM realmlist;"`
3. Puerto 8085 está abierto

### Problema: "Cannot connect to server" después de elegir realm

**Causa:** IP en realmlist DB es incorrecta

**Solución:**
```bash
kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml
```

---

## 📚 Referencias

- **k3s Networking:** https://docs.k3s.io/networking
- **Kubernetes Services:** https://kubernetes.io/docs/concepts/services-networking/service/
- **MetalLB:** https://metallb.universe.tf/
- **CMaNGOS Network Config:** https://github.com/cmangos/issues/wiki

---

**Última actualización:** 2025-11-07
