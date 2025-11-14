// API Configuration
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // Close menu when clicking on a link (mobile)
    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                menuToggle.classList.remove('active');
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });
}

// Navigation
document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        showPage(page);
    });
});

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));

    // Show selected page
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Load page data
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'characters':
            loadCharacters();
            break;
        case 'items':
            break;
        case 'skills':
            break;
        case 'spells':
            break;
        case 'reputations':
            break;
        case 'quests':
            break;
        case 'commands':
            loadCommands();
            break;
        case 'server':
            loadServerInfo();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/server/stats`);
        const stats = await response.json();

        document.getElementById('total-accounts').textContent = stats.accounts;
        document.getElementById('total-characters').textContent = stats.characters;
        document.getElementById('avg-level').textContent = stats.averageLevel;
        document.getElementById('online-players').textContent = stats.onlinePlayers;

        // Realm list
        const realmList = document.getElementById('realm-list');
        realmList.innerHTML = stats.realms.map(realm => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${realm.name}</strong><br>
                <small>Dirección: ${realm.address}:${realm.port}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Accounts
async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/accounts`);
        const accounts = await response.json();

        const tbody = document.getElementById('accounts-table-body');
        tbody.innerHTML = accounts.map(acc => `
            <tr>
                <td>${acc.id}</td>
                <td>${acc.username}</td>
                <td>${acc.email || '-'}</td>
                <td>${acc.gmlevel}</td>
                <td>${new Date(acc.joindate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="editAccount(${acc.id})">Editar</button>
                    <button class="btn btn-small btn-danger" onclick="deleteAccount(${acc.id})">Banear</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

function showCreateAccountModal() {
    document.getElementById('create-account-modal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

async function createAccount(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Cuenta creada exitosamente');
            closeModal('create-account-modal');
            loadAccounts();
            event.target.reset();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error creating account:', error);
        alert('Error al crear cuenta');
    }
}

// Characters
async function loadCharacters() {
    try {
        const response = await fetch(`${API_URL}/characters`);
        const characters = await response.json();

        const tbody = document.getElementById('characters-table-body');
        tbody.innerHTML = characters.map(char => `
            <tr>
                <td>${char.guid}</td>
                <td>${char.name}</td>
                <td>${char.username || char.account}</td>
                <td>${char.level}</td>
                <td>${formatMoney(char.money)}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="editCharacter(${char.guid})">Editar</button>
                    <button class="btn btn-small btn-success" onclick="giveItem(${char.guid}, '${char.name}')">Dar Item</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

function formatMoney(copper) {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperLeft = copper % 100;
    return `${gold}g ${silver}s ${copperLeft}c`;
}

// Items
async function searchItems() {
    const query = document.getElementById('item-search').value;
    if (query.length < 3) return;

    try {
        const response = await fetch(`${API_URL}/items/search?q=${encodeURIComponent(query)}`);
        const items = await response.json();

        const results = document.getElementById('items-results');
        results.innerHTML = items.map(item => `
            <div class="item-card">
                <h4 class="quality-${item.Quality}">${item.name}</h4>
                <p>ID: ${item.entry} | Item Level: ${item.ItemLevel} | Required Level: ${item.RequiredLevel}</p>
                <button class="btn btn-small btn-primary" onclick="showGiveItemDialog(${item.entry}, '${item.name}')">Dar Item</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching items:', error);
    }
}

// Commands
async function loadCommands() {
    try {
        const response = await fetch(`${API_URL}/commands/common`);
        const commands = await response.json();

        const grid = document.getElementById('common-commands-grid');
        grid.innerHTML = commands.map(cmd => `
            <div class="command-card" onclick="fillCommand('${cmd.syntax}')">
                <h4>${cmd.name}</h4>
                <p>${cmd.description}</p>
                <code>${cmd.syntax}</code>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading commands:', error);
    }
}

function fillCommand(syntax) {
    document.getElementById('command-input').value = syntax;
}

async function executeCommand() {
    const command = document.getElementById('command-input').value;
    const characterName = document.getElementById('character-target').value;

    try {
        const response = await fetch(`${API_URL}/commands/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, characterName })
        });

        const result = await response.json();
        document.getElementById('command-result').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        console.error('Error executing command:', error);
        document.getElementById('command-result').textContent = 'Error: ' + error.message;
    }
}

// Server Info
async function loadServerInfo() {
    try {
        const response = await fetch(`${API_URL}/server/realms`);
        const realms = await response.json();

        const config = document.getElementById('realm-config');
        config.innerHTML = realms.map(realm => `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3>${realm.name}</h3>
                <p><strong>Dirección:</strong> ${realm.address}</p>
                <p><strong>Puerto:</strong> ${realm.port}</p>
                <p><strong>Icono:</strong> ${realm.icon}</p>
                <p><strong>Zona Horaria:</strong> ${realm.timezone}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading server info:', error);
    }
}

// Skills Search
let skillsSearchTimeout;
async function searchSkills() {
    clearTimeout(skillsSearchTimeout);
    const query = document.getElementById('skill-search').value;

    if (query.length < 2) {
        document.getElementById('skills-results').innerHTML = '<p style="text-align:center; color:#7f8c8d;">Escribe al menos 2 caracteres para buscar...</p>';
        return;
    }

    skillsSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/skills/search?q=${encodeURIComponent(query)}`);
            const skills = await response.json();

            const results = document.getElementById('skills-results');
            if (skills.length === 0) {
                results.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No se encontraron skills.</p>';
                return;
            }

            results.innerHTML = skills.map(skill => `
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
        } catch (error) {
            console.error('Error searching skills:', error);
            document.getElementById('skills-results').innerHTML = '<p style="text-align:center; color:#e74c3c;">Error al buscar skills.</p>';
        }
    }, 300);
}

// Spells Search
let spellsSearchTimeout;
async function searchSpells() {
    clearTimeout(spellsSearchTimeout);
    const query = document.getElementById('spell-search').value;

    if (query.length < 2) {
        document.getElementById('spells-results').innerHTML = '<p style="text-align:center; color:#7f8c8d;">Escribe al menos 2 caracteres para buscar...</p>';
        return;
    }

    spellsSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/spells/search?q=${encodeURIComponent(query)}`);
            const spells = await response.json();

            const results = document.getElementById('spells-results');
            if (spells.length === 0) {
                results.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No se encontraron hechizos.</p>';
                return;
            }

            results.innerHTML = spells.map(spell => `
                <div class="result-card" onclick="copyToClipboard('.learn ${spell.id}')">
                    <span class="card-id">ID: ${spell.id}</span>
                    <h4>${spell.name}</h4>
                    <p><strong>Rango:</strong> ${spell.rank || 'N/A'}</p>
                    <p><strong>Nivel:</strong> ${spell.level || 0}</p>
                    <div class="actions">
                        <button class="btn btn-small btn-primary" onclick="fillCommand('.learn ${spell.id}'); event.stopPropagation();">Aprender</button>
                        <button class="btn btn-small btn-success" onclick="fillCommand('.cast ${spell.id}'); event.stopPropagation();">Castear</button>
                        <button class="btn btn-small btn-success" onclick="copyToClipboard('${spell.id}'); event.stopPropagation();">Copiar ID</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error searching spells:', error);
            document.getElementById('spells-results').innerHTML = '<p style="text-align:center; color:#e74c3c;">Error al buscar hechizos.</p>';
        }
    }, 300);
}

// Reputations Search
let reputationsSearchTimeout;
async function searchReputations() {
    clearTimeout(reputationsSearchTimeout);
    const query = document.getElementById('reputation-search').value;

    if (query.length < 2) {
        document.getElementById('reputations-results').innerHTML = '<p style="text-align:center; color:#7f8c8d;">Escribe al menos 2 caracteres para buscar...</p>';
        return;
    }

    reputationsSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/reputations/search?q=${encodeURIComponent(query)}`);
            const reputations = await response.json();

            const results = document.getElementById('reputations-results');
            if (reputations.length === 0) {
                results.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No se encontraron facciones.</p>';
                return;
            }

            results.innerHTML = reputations.map(rep => `
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
        } catch (error) {
            console.error('Error searching reputations:', error);
            document.getElementById('reputations-results').innerHTML = '<p style="text-align:center; color:#e74c3c;">Error al buscar facciones.</p>';
        }
    }, 300);
}

// Quests Search
let questsSearchTimeout;
async function searchQuests() {
    clearTimeout(questsSearchTimeout);
    const query = document.getElementById('quest-search').value;

    if (query.length < 2) {
        document.getElementById('quests-results').innerHTML = '<p style="text-align:center; color:#7f8c8d;">Escribe al menos 2 caracteres para buscar...</p>';
        return;
    }

    questsSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/quests/search?q=${encodeURIComponent(query)}`);
            const quests = await response.json();

            const results = document.getElementById('quests-results');
            if (quests.length === 0) {
                results.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No se encontraron misiones.</p>';
                return;
            }

            results.innerHTML = quests.map(quest => `
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
        } catch (error) {
            console.error('Error searching quests:', error);
            document.getElementById('quests-results').innerHTML = '<p style="text-align:center; color:#e74c3c;">Error al buscar misiones.</p>';
        }
    }, 300);
}

// Copy to clipboard utility
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado al portapapeles!');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Initialize
loadDashboard();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.log('Error al registrar Service Worker:', err));
    });
}
