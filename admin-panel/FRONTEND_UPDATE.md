# Actualización del Frontend - Paginación y Carga Inicial

## ✅ Completado en Backend

### Endpoints API actualizados:

Todos los endpoints ahora soportan paginación y devuelven datos en este formato:

```json
{
  "data": [...],  // Array de resultados
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### Características implementadas:

1. **Carga inicial sin query** - Devuelve primeros 50 resultados ordenados alfabéticamente
2. **Búsqueda con filtro** - Filtra resultados cuando se proporciona `?q=texto`
3. **Paginación** - Parámetros `?page=1&limit=50`
4. **Datos estáticos**:
   - **Skills**: 43 skills de WoW Classic
   - **Spells**: 120+ hechizos de todas las clases
   - **Reputations**: 35 facciones
5. **Datos de base de datos**:
   - **Quests**: Tabla quest_template
   - **Items**: Tabla item_template

## 🔄 Pendiente - Actualización Frontend

### Archivo: `admin-panel/web/public/app.js`

Necesitas actualizar las funciones de búsqueda para que:

1. **Llamen a la API sin query** al cargar la página
2. **Manejen el objeto de respuesta** con `data` y `pagination`
3. **Rendericen controles de paginación**
4. **Implementen navegación** entre páginas

### Cambios necesarios:

#### 1. Actualizar función `showPage()`:

```javascript
case 'skills':
    loadSkills(1); // Carga inicial con página 1
    break;
case 'spells':
    loadSpells(1);
    break;
// ... etc
```

#### 2. Crear funciones de carga inicial:

```javascript
// Cargar skills (sin query, solo paginación)
async function loadSkills(page = 1) {
    showLoading('skills-results');
    try {
        const response = await fetch(`${API_URL}/skills/search?page=${page}&limit=50`);
        const result = await response.json();

        if (result.data && result.data.length > 0) {
            document.getElementById('skills-results').innerHTML = renderSkills(result.data);
            renderPagination('skills-pagination', result.pagination, 'loadSkills');
        } else {
            showNoResults('skills-results');
        }
    } catch (error) {
        showError('skills-results');
    }
}
```

#### 3. Actualizar funciones de búsqueda:

```javascript
async function searchSkills() {
    clearTimeout(skillsSearchTimeout);
    const query = document.getElementById('skill-search').value;

    // Si no hay query, cargar datos iniciales
    if (!query || query.trim() === '') {
        loadSkills(1);
        return;
    }

    skillsSearchTimeout = setTimeout(async () => {
        showLoading('skills-results');
        try {
            const response = await fetch(`${API_URL}/skills/search?q=${encodeURIComponent(query)}&page=1&limit=50`);
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                document.getElementById('skills-results').innerHTML = renderSkills(result.data);
                renderPagination('skills-pagination', result.pagination, 'searchSkills');
            } else {
                showNoResults('skills-results', 'No se encontraron skills');
            }
        } catch (error) {
            showError('skills-results');
        }
    }, 300);
}
```

#### 4. Añadir contenedores de paginación en HTML:

En `index.html`, actualizar cada sección de búsqueda:

```html
<!-- Skills Page -->
<div id="skills-page" class="page">
    <h2>🎯 Buscador de Skills</h2>
    <div class="search-bar">
        <input type="text" id="skill-search" placeholder="Buscar skill..." onkeyup="searchSkills()">
    </div>
    <div id="skills-results" class="results-grid"></div>
    <div id="skills-pagination" class="pagination-container"></div> <!-- NUEVO -->
</div>
```

#### 5. Estilos para paginación en `styles.css`:

```css
.pagination-container {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
}

.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.pagination-info {
    color: #7f8c8d;
    font-size: 14px;
}

.pagination-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
}

.page-indicator {
    padding: 0 15px;
    color: #2c3e50;
    font-weight: 500;
}

.btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

## 🧪 Cómo Probar

1. **Deploy el backend** (ya está listo):
   ```bash
   cd admin-panel
   ./deploy.sh
   ```

2. **Actualizar frontend**:
   - Añadir contenedores de paginación en `index.html`
   - Actualizar `app.js` con las nuevas funciones
   - Añadir estilos de paginación en `styles.css`

3. **Probar flujo**:
   - Entrar a "Skills" → Debería cargar 50 skills alfabéticamente
   - Hacer clic en "Siguiente" → Página 2
   - Buscar "sword" → Filtrar resultados
   - Borrar búsqueda → Volver a página 1 inicial

## 📝 Funciones de Utilidad (ya creadas en search-utils.js)

```javascript
// Renderizar resultados
renderSkills(skills)
renderSpells(spells)
renderReputations(reputations)
renderQuests(quests)
renderItems(items)

// Estados UI
showLoading(containerId)
showNoResults(containerId, message)
showError(containerId, message)
renderPagination(containerId, pagination, searchFunction)
```

## 🎯 Beneficios

1. ✅ **Carga inicial rápida** - No esperar a que el usuario escriba
2. ✅ **Navegación por páginas** - No cargar todo de una vez
3. ✅ **Mejor UX** - Ver datos inmediatamente al entrar
4. ✅ **Autocompletado** - Filtrar mientras escribe (300ms debounce)
5. ✅ **Performance** - Solo 50 resultados por página
6. ✅ **Escalable** - Funciona con miles de registros en la BD

## 🔍 Ejemplo Completo - Skills

**Escenario 1: Carga inicial**
- Usuario entra a "Skills"
- `loadSkills(1)` se ejecuta automáticamente
- API: `GET /api/skills/search?page=1&limit=50`
- Muestra 50 skills alfabéticamente (Alchemy, Axes, Blacksmithing...)
- Botones: [Anterior (disabled)] [Página 1 de 1] [Siguiente (disabled)]

**Escenario 2: Búsqueda**
- Usuario escribe "sword"
- Después de 300ms → `searchSkills()`
- API: `GET /api/skills/search?q=sword&page=1&limit=50`
- Muestra solo skills con "sword" (Swords, Two-Handed Swords)
- Info: "Mostrando 1 - 2 de 2 resultados"

**Escenario 3: Limpiar búsqueda**
- Usuario borra el texto
- `searchSkills()` detecta query vacío
- Llama a `loadSkills(1)`
- Vuelve a mostrar los 50 primeros alfabéticamente

## 🚀 Siguiente Paso

Ejecuta el deploy del backend y actualiza el frontend siguiendo las instrucciones above.
Luego haz commit de los cambios del frontend.
