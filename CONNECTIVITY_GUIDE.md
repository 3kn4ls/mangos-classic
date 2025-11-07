# 🔌 Guía Rápida de Conectividad

## ✅ Verificación Automática

```bash
./check-connectivity.sh
```

Este script verifica todo y te da instrucciones específicas para tu configuración.

---

## 🎯 Configuración del Cliente WoW

### 1. Obtener IP del Servidor

```bash
# Desde el servidor k3s
kubectl get nodes -o wide

# La IP que necesitas es INTERNAL-IP o EXTERNAL-IP
```

### 2. Editar realmlist.wtf

En tu directorio de World of Warcraft 1.12.1:

```
set realmlist <IP_DEL_SERVIDOR>
```

**Ejemplo:**
```
set realmlist 192.168.1.100
```

### 3. Iniciar WoW

- Usuario: `admin`
- Contraseña: `admin`

---

## 🔧 Puertos Necesarios

| Servicio | Puerto | Debe estar abierto |
|----------|--------|-------------------|
| realmd (auth) | 3724 | ✅ Sí |
| mangosd (game) | 8085 | ✅ Sí |

---

## 🧪 Probar Conectividad

### Desde tu PC (Windows)

```powershell
# Probar realmd
Test-NetConnection -ComputerName <IP_SERVIDOR> -Port 3724

# Probar mangosd
Test-NetConnection -ComputerName <IP_SERVIDOR> -Port 8085
```

### Desde tu PC (Linux/Mac)

```bash
# Probar realmd
nc -zv <IP_SERVIDOR> 3724

# Probar mangosd
nc -zv <IP_SERVIDOR> 8085
```

### Desde el servidor k3s

```bash
# Obtener IP del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

# Probar
telnet $NODE_IP 3724
telnet $NODE_IP 8085
```

---

## ❌ Problemas Comunes

### "Cannot connect to server" al iniciar WoW

**Causa:** realmd no es accesible

**Solución:**
```bash
# Verificar pod está corriendo
kubectl get pods -n mangos-classic

# Ver logs
kubectl logs -n mangos-classic -l app=realmd

# Probar conectividad
./check-connectivity.sh
```

### Aparecen reinos pero no puedes conectar

**Causa:** Realmlist en DB tiene IP incorrecta

**Solución:**
```bash
# Actualizar automáticamente
kubectl apply -f kubernetes/jobs/update-realmlist-job.yaml

# Ver resultado
kubectl logs -n mangos-classic job/update-realmlist
```

### Firewall bloquea conexión

```bash
# En el servidor k3s, abrir puertos
sudo firewall-cmd --permanent --add-port=3724/tcp
sudo firewall-cmd --permanent --add-port=8085/tcp
sudo firewall-cmd --reload

# O con ufw
sudo ufw allow 3724/tcp
sudo ufw allow 8085/tcp
```

### NodePort en lugar de puertos estándar

Si ves puertos 30724 y 30085, estás usando NodePort.

**Cambiar a hostPort:**
```bash
kubectl apply -f kubernetes/realmd/deployment-hostport.yaml
kubectl apply -f kubernetes/mangosd/deployment-hostport.yaml
```

---

## 📋 Checklist de Conectividad

- [ ] Pods están corriendo (`kubectl get pods -n mangos-classic`)
- [ ] Puerto 3724 abierto en firewall
- [ ] Puerto 8085 abierto en firewall
- [ ] Realmlist en DB tiene IP correcta
- [ ] realmlist.wtf apunta a la IP correcta
- [ ] Puedes hacer telnet a ambos puertos
- [ ] Cliente WoW es versión 1.12.1

---

## 🆘 Comando de Emergencia

Si nada funciona, ejecuta:

```bash
# Script completo de diagnóstico
./check-connectivity.sh > diagnostico.txt

# Revisar el archivo
cat diagnostico.txt

# Compartir en Discord/Forum para ayuda
```

---

## 📚 Documentación Completa

Para configuración avanzada y diferentes opciones de exposición de puertos:

👉 **[NETWORK_CONFIGURATION.md](NETWORK_CONFIGURATION.md)**

---

**Ayuda:** Si sigues teniendo problemas, revisa los logs:

```bash
kubectl logs -n mangos-classic -l app=realmd
kubectl logs -n mangos-classic -l app=mangosd
kubectl logs -n mangos-classic mysql-0
```
