// API Configuration
// Use relative path to work with any base path (e.g., /cmangos)
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : './api';

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

// Initialize
loadDashboard();
