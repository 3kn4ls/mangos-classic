# MaNGOS Classic Admin Panel

Panel de administración web moderno para servidores MaNGOS Classic con diseño responsive y soporte PWA.

## 🚨 Error 404 en los Endpoints? LÉEME PRIMERO

Si estás viendo errores 404 en `/api/skills`, `/api/reputations`, `/api/spells`, o `/api/quests`, es porque **el código actualizado no está corriendo en el servidor**.

### Solución Rápida

Ejecuta en tu servidor (donde tienes kubectl):

```bash
cd /path/to/mangos-classic/admin-panel

# Opción 1: Rebuild completo (recomendado si actualizaste código)
./deploy.sh

# Opción 2: Solo reiniciar (si la imagen ya está actualizada)
./quick-restart.sh
```

## 📋 Scripts Disponibles

### `deploy.sh` - Deployment Completo
Reconstruye la imagen Docker y reinicia el deployment de Kubernetes.

```bash
./deploy.sh
```

Este script:
- ✅ Construye nueva imagen Docker con los cambios
- ✅ La importa a k3s (si aplica)
- ✅ Reinicia el deployment de Kubernetes
- ✅ Espera a que el rollout complete
- ✅ Prueba los endpoints automáticamente
- ✅ Muestra los logs

### `quick-restart.sh` - Reinicio Rápido
Solo reinicia los pods sin reconstruir la imagen (útil si ya hiciste build).

```bash
./quick-restart.sh
```

### `troubleshoot.sh` - Diagnóstico
Ejecuta múltiples verificaciones para diagnosticar problemas.

```bash
./troubleshoot.sh
```

Este script verifica:
- Namespace y deployment
- Estado de los pods
- Servicios e ingress
- Logs recientes
- Conectividad a base de datos
- Archivos de rutas en el pod
- Endpoints de API

## 🎯 Características

### Interfaz Web
- ✅ **PWA** (Progressive Web App) con soporte offline
- ✅ **Diseño responsive** mobile-first
- ✅ **Menú plegable** para dispositivos móviles
- ✅ **Theme color** personalizado
- ✅ **Service Worker** para caché

### Buscadores de Recursos
- 🎯 **Skills**: 43 skills de WoW Classic con IDs (Swords, Blacksmithing, etc.)
- ⭐ **Reputations**: 35 facciones (Stormwind, Orgrimmar, Argent Dawn, etc.)
- ✨ **Spells**: Búsqueda en base de datos con filtros
- 📜 **Quests**: Búsqueda de misiones por nombre o ID

### Gestión
- 👥 **Cuentas**: Crear, editar, banear cuentas
- ⚔️ **Personajes**: Ver stats, inventario, dar items
- 🎒 **Items**: Búsqueda avanzada con filtros de calidad

### Comandos GM
- ⌨️ **Consola**: Ejecutar comandos directamente
- 📋 **Comandos comunes**: Accesos rápidos a comandos frecuentes
- 📋 **Copiar IDs**: Un clic para copiar al portapapeles

## 🏗️ Arquitectura

```
admin-panel/
├── api/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── server.js      # Servidor principal
│   │   └── database.js    # Pools de conexión MySQL
│   ├── routes/            # Endpoints REST
│   │   ├── accounts.js
│   │   ├── characters.js
│   │   ├── items.js
│   │   ├── skills.js      # ✨ NUEVO
│   │   ├── spells.js      # ✨ NUEVO
│   │   ├── reputations.js # ✨ NUEVO
│   │   └── quests.js      # ✨ NUEVO
│   ├── Dockerfile
│   └── package.json
├── web/                   # Frontend (HTML/CSS/JS puro)
│   ├── public/
│   │   ├── index.html     # ✨ Actualizado con nuevas secciones
│   │   ├── app.js         # ✨ Actualizado con buscadores
│   │   ├── styles.css     # ✨ Responsive design
│   │   ├── manifest.json  # ✨ PWA manifest
│   │   ├── sw.js          # ✨ Service Worker
│   │   └── icons/         # ✨ PWA icons
│   ├── Dockerfile
│   └── nginx.conf
├── deploy.sh              # ✨ Script de deployment
├── quick-restart.sh       # ✨ Script de reinicio rápido
└── troubleshoot.sh        # ✨ Script de diagnóstico
```

## 📡 Endpoints de API

### Existentes
- `GET /api/accounts` - Listar cuentas
- `POST /api/accounts` - Crear cuenta
- `GET /api/characters` - Listar personajes
- `GET /api/items/search?q=` - Buscar items
- `GET /api/server/stats` - Estadísticas del servidor
- `POST /api/commands/execute` - Ejecutar comando GM

### Nuevos ✨
- `GET /api/skills/search?q=` - Buscar skills (datos estáticos)
- `GET /api/reputations/search?q=` - Buscar facciones (datos estáticos)
- `GET /api/spells/search?q=` - Buscar hechizos (base de datos)
- `GET /api/quests/search?q=` - Buscar misiones (base de datos)

## 🔧 Configuración

### Variables de Entorno

Las siguientes variables se configuran en el deployment de Kubernetes:

```bash
NODE_ENV=production
DB_HOST=mysql-service
DB_PORT=3306
DB_USER=mangos
DB_PASSWORD=<from-secret>
REALMD_DB=classicrealmd
CHARACTERS_DB=classiccharacters
WORLD_DB=classicmangos
CORS_ORIGIN=*
```

### Base de Datos

El API se conecta a tres bases de datos de MaNGOS:
- `realmd` - Cuentas de usuario
- `characters` - Personajes y datos de jugadores
- `world` - Items, quests, spells, etc.

## 🐛 Troubleshooting

### Endpoints devuelven 404

**Causa**: El código actualizado no está corriendo en el servidor.

**Solución**:
```bash
./deploy.sh
```

### Spells o Quests devuelven array vacío

**Causa**: Tu versión de MaNGOS puede usar tablas diferentes.

**Solución**: Verifica las tablas en tu base de datos:
```sql
SHOW TABLES LIKE '%spell%';
SHOW TABLES LIKE '%quest%';
```

Si las tablas tienen nombres diferentes, edita:
- `api/routes/spells.js`
- `api/routes/quests.js`

### Error de conexión a base de datos

**Solución**:
```bash
# Verifica que MySQL esté corriendo
kubectl get pods -n mangos-classic | grep mysql

# Verifica los secrets
kubectl get secrets -n mangos-classic database-secrets -o yaml

# Prueba conexión desde un pod
kubectl exec -it -n mangos-classic <pod-name> -- sh
mysql -h mysql-service -u mangos -p
```

### Pods en CrashLoopBackOff

**Solución**:
```bash
# Ver logs del pod que falla
kubectl logs -n mangos-classic <pod-name>

# Ver descripción del pod
kubectl describe pod -n mangos-classic <pod-name>

# Verificar la imagen
kubectl get pod -n mangos-classic <pod-name> -o jsonpath='{.spec.containers[0].image}'
```

### Menú no se pliega en móvil

**Solución**: Limpia la caché del navegador o realiza un "hard refresh":
- Chrome/Firefox: `Ctrl+Shift+R` o `Cmd+Shift+R`
- Safari: `Cmd+Option+R`

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
kubectl logs -f -n mangos-classic -l app=admin-api
```

### Ver estado de los pods
```bash
kubectl get pods -n mangos-classic -l app=admin-api -w
```

### Métricas de recursos
```bash
kubectl top pods -n mangos-classic -l app=admin-api
```

## 🔄 Rollback

Si algo sale mal después de un deployment:

```bash
# Ver historial de rollouts
kubectl rollout history deployment/admin-api -n mangos-classic

# Hacer rollback al deployment anterior
kubectl rollout undo deployment/admin-api -n mangos-classic

# Rollback a una revisión específica
kubectl rollout undo deployment/admin-api -n mangos-classic --to-revision=2
```

## 🚀 Desarrollo Local

### Ejecutar API localmente

```bash
cd admin-panel/api
npm install
npm run dev
```

### Ejecutar Web localmente

```bash
cd admin-panel/web
# Usar cualquier servidor HTTP simple
python3 -m http.server 8080 --directory public
# O
npx serve public
```

## 📝 Changelog

### v2.0.0 (Latest)
- ✨ Convertido a PWA con soporte offline
- ✨ Diseño responsive mobile-first
- ✨ Menú lateral plegable para móvil
- ✨ Buscador de Skills (43 skills)
- ✨ Buscador de Reputations (35 facciones)
- ✨ Buscador de Spells
- ✨ Buscador de Quests
- 🐛 Corregidos imports de database en todas las rutas
- 🐛 Mejorado manejo de errores
- 📄 Scripts de deployment automatizados

### v1.0.0
- Panel básico con gestión de cuentas y personajes
- Búsqueda de items
- Consola de comandos GM

## 📄 Licencia

Este proyecto es parte de MaNGOS Classic y sigue la misma licencia GPL.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

- Issues: https://github.com/3kn4ls/mangos-classic/issues
- Documentación MaNGOS: https://getmangos.eu/
