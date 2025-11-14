// Utilidades para búsqueda con paginación y autocompletado
// Este archivo contiene funciones reutilizables para todos los buscadores

// Estado de paginación para cada buscador
const searchState = {
    skills: { page: 1, query: '', total: 0 },
    spells: { page: 1, query: '', total: 0 },
    reputations: { page: 1, query: '', total: 0 },
    quests: { page: 1, query: '', total: 0 },
    items: { page: 1, query: '', total: 0 }
};

// Función genérica para renderizar controles de paginación
function renderPagination(containerId, pagination, searchFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const paginationHtml = `
        <div class="pagination-controls">
            <div class="pagination-info">
                Mostrando ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} resultados
            </div>
            <div class="pagination-buttons">
                <button
                    class="btn btn-small ${pagination.page === 1 ? 'disabled' : ''}"
                    onclick="${searchFunction}(${pagination.page - 1})"
                    ${pagination.page === 1 ? 'disabled' : ''}
                >
                    ← Anterior
                </button>
                <span class="page-indicator">Página ${pagination.page} de ${pagination.totalPages}</span>
                <button
                    class="btn btn-small ${!pagination.hasMore ? 'disabled' : ''}"
                    onclick="${searchFunction}(${pagination.page + 1})"
                    ${!pagination.hasMore ? 'disabled' : ''}
                >
                    Siguiente →
                </button>
            </div>
        </div>
    `;

    // Insertar paginación al final del contenedor
    const paginationContainer = container.parentElement.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.innerHTML = paginationHtml;
    } else {
        const newPaginationContainer = document.createElement('div');
        newPaginationContainer.className = 'pagination-container';
        newPaginationContainer.innerHTML = paginationHtml;
        container.parentElement.appendChild(newPaginationContainer);
    }
}

// Función para renderizar resultados de skills
function renderSkills(skills) {
    return skills.map(skill => `
        <div class="result-card" onclick="copyToClipboard('.learn ${skill.id}')">
            <span class="card-id">ID: ${skill.id}</span>
            <h4>${skill.name}</h4>
            <p><strong>Categoría:</strong> ${skill.category || 'N/A'}</p>
            <div class="actions">
                <button class="btn btn-small btn-primary" onclick="fillCommand('.learn ${skill.id}'); event.stopPropagation();">Aprender Skill</button>
                <button class="btn btn-small btn-success" onclick="copyToClipboard('${skill.id}'); event.stopPropagation();">Copiar ID</button>
            </div>
        </div>
    `).join('');
}

// Función para renderizar resultados de spells
function renderSpells(spells) {
    return spells.map(spell => `
        <div class="result-card" onclick="copyToClipboard('.learn ${spell.id}')">
            <span class="card-id">ID: ${spell.id}</span>
            <h4>${spell.name}</h4>
            <p><strong>Clase:</strong> ${spell.class || 'N/A'} | <strong>Rango:</strong> ${spell.rank || 'N/A'}</p>
            <p><strong>Nivel:</strong> ${spell.level || 0}</p>
            <div class="actions">
                <button class="btn btn-small btn-primary" onclick="fillCommand('.learn ${spell.id}'); event.stopPropagation();">Aprender</button>
                <button class="btn btn-small btn-success" onclick="fillCommand('.cast ${spell.id}'); event.stopPropagation();">Castear</button>
                <button class="btn btn-small btn-success" onclick="copyToClipboard('${spell.id}'); event.stopPropagation();">Copiar ID</button>
            </div>
        </div>
    `).join('');
}

// Función para renderizar resultados de reputations
function renderReputations(reputations) {
    return reputations.map(rep => `
        <div class="result-card" onclick="copyToClipboard('.modify reputation ${rep.id} 42999')">
            <span class="card-id">ID: ${rep.id}</span>
            <h4>${rep.name}</h4>
            <p><strong>Facción:</strong> ${rep.team || 'Neutral'}</p>
            <div class="actions">
                <button class="btn btn-small btn-primary" onclick="fillCommand('.modify reputation ${rep.id} 42999'); event.stopPropagation();">Exaltado</button>
                <button class="btn btn-small btn-success" onclick="copyToClipboard('${rep.id}'); event.stopPropagation();">Copiar ID</button>
            </div>
        </div>
    `).join('');
}

// Función para renderizar resultados de quests
function renderQuests(quests) {
    return quests.map(quest => `
        <div class="result-card" onclick="copyToClipboard('.quest add ${quest.id}')">
            <span class="card-id">ID: ${quest.id}</span>
            <h4>${quest.title}</h4>
            <p><strong>Nivel:</strong> ${quest.level || 0} | <strong>Min Level:</strong> ${quest.minLevel || 0}</p>
            <div class="actions">
                <button class="btn btn-small btn-primary" onclick="fillCommand('.quest add ${quest.id}'); event.stopPropagation();">Agregar</button>
                <button class="btn btn-small btn-success" onclick="fillCommand('.quest complete ${quest.id}'); event.stopPropagation();">Completar</button>
                <button class="btn btn-small btn-success" onclick="copyToClipboard('${quest.id}'); event.stopPropagation();">Copiar ID</button>
            </div>
        </div>
    `).join('');
}

// Función para renderizar resultados de items
function renderItems(items) {
    return items.map(item => `
        <div class="item-card">
            <h4 class="quality-${item.Quality}">${item.name}</h4>
            <p>ID: ${item.entry} | Item Level: ${item.ItemLevel} | Required Level: ${item.RequiredLevel}</p>
            <button class="btn btn-small btn-primary" onclick="showGiveItemDialog(${item.entry}, '${item.name}')">Dar Item</button>
        </div>
    `).join('');
}

// Función para mostrar mensaje cuando no hay resultados
function showNoResults(containerId, message = 'No se encontraron resultados') {
    document.getElementById(containerId).innerHTML = `<p style="text-align:center; color:#7f8c8d;">${message}</p>`;
}

// Función para mostrar mensaje de error
function showError(containerId, message = 'Error al buscar') {
    document.getElementById(containerId).innerHTML = `<p style="text-align:center; color:#e74c3c;">${message}</p>`;
}

// Función para mostrar loading
function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = `<p style="text-align:center; color:#7f8c8d;"><span class="loading-spinner"></span> Cargando...</p>`;
}
