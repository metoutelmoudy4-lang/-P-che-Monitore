/**
 * Péche Monitore - Script JavaScript
 * Gestion de l'interface utilisateur et des appels API
 */

// Configuration
const API_URL = 'http://localhost:5000/api';

// États de l'application
let currentTab = 'sessions';
let sessionsData = [];

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎣 Péche Monitore démarrée');
    
    // Charger les sessions
    loadSessions();
    
    // Configurer les onglets
    setupTabs();
    
    // Configurer le formulaire
    setupForm();
    
    // Charger les stats
    loadStats();
});

// ==========================================
// GESTION DES ONGLETS
// ==========================================

function setupTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            navButtons.forEach(b => b.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            btn.classList.add('active');
            
            // Récupérer l'onglet
            const tabName = btn.dataset.tab;
            currentTab = tabName;
            
            // Afficher l'onglet correspondant
            showTab(tabName);
        });
    });
}

function showTab(tabName) {
    // Masquer tous les onglets
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Afficher l'onglet demandé
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Rafraîchir les données si nécessaire
    if (tabName === 'stats') {
        loadStats();
    }
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================

function setupForm() {
    const form = document.getElementById('session-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = new FormData(form);
        const data = {
            lieu: formData.get('lieu'),
            date: formData.get('date'),
            heure_debut: formData.get('heure_debut'),
            heure_fin: formData.get('heure_fin'),
            nombre_captures: parseInt(formData.get('nombre_captures')) || 0,
            especes: formData.get('especes')
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0),
            notes: formData.get('notes')
        };
        
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('✅ Session enregistrée avec succès');
                form.reset();
                
                // Charger les sessions et aller à l'onglet sessions
                await loadSessions();
                document.querySelector('[data-tab="sessions"]').click();
                
                showNotification('Session enregistrée avec succès! 🎣');
            } else {
                showNotification('Erreur lors de l\'enregistrement', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur de connexion au serveur', 'error');
        }
    });
}

// ==========================================
// CHARGEMENT DES SESSIONS
// ==========================================

async function loadSessions() {
    try {
        const response = await fetch(`${API_URL}/sessions`);
        
        if (response.ok) {
            sessionsData = await response.json();
            renderSessions();
        } else {
            console.error('Erreur lors du chargement des sessions');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

function renderSessions() {
    const sessionsList = document.getElementById('sessions-list');
    
    if (sessionsData.length === 0) {
        sessionsList.innerHTML = '<p class="empty-state">Aucune session enregistrée. Créez-en une pour commencer!</p>';
        return;
    }
    
    sessionsList.innerHTML = sessionsData.map(session => `
        <div class="session-card">
            <h3>📍 ${session.lieu}</h3>
            <p><span class="label">📅 Date:</span> ${formatDate(session.date)}</p>
            ${session.heure_debut ? `<p><span class="label">⏰ Horaire:</span> ${session.heure_debut} - ${session.heure_fin || 'N/A'}</p>` : ''}
            <p><span class="label">🐟 Captures:</span> ${session.nombre_captures}</p>
            ${session.especes.length > 0 ? `<p><span class="label">🐟 Espèces:</span> ${session.especes.join(', ')}</p>` : ''}
            ${session.notes ? `<p><span class="label">📝 Notes:</span> ${session.notes}</p>` : ''}
            <div class="session-actions">
                <button class="btn btn-danger" onclick="deleteSession(${session.id})">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// ==========================================
// SUPPRESSION DE SESSION
// ==========================================

async function deleteSession(sessionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session?')) {
        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Session supprimée ✅');
                await loadSessions();
            } else {
                showNotification('Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur de connexion', 'error');
        }
    }
}

// ==========================================
// CHARGEMENT DES STATISTIQUES
// ==========================================

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        
        if (response.ok) {
            const stats = await response.json();
            renderStats(stats);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function renderStats(stats) {
    // Mettre à jour les cartes de statistiques
    document.getElementById('total-sessions').textContent = stats.total_sessions;
    document.getElementById('total-captures').textContent = stats.total_captures;
    
    // Mettre à jour les espèces les plus capturées
    const speciesList = document.getElementById('top-species');
    
    if (stats.top_species.length === 0) {
        speciesList.innerHTML = '<p class="empty-state">Aucune donnée disponible</p>';
        return;
    }
    
    speciesList.innerHTML = stats.top_species.map(([species, count]) => `
        <div class="species-item">
            <span class="species-name">🐟 ${species}</span>
            <span class="species-count">${count} capture(s)</span>
        </div>
    `).join('');
}

// ==========================================
// UTILITAIRES
// ==========================================

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function showNotification(message, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Créer une notification visuelle simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Retirer la notification après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// STYLE POUR LES ANIMATIONS DE NOTIFICATION
// ==========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// DÉBOGAGE
// ==========================================

console.log('%c🎣 Péche Monitore', 'font-size: 20px; color: #2980b9; font-weight: bold;');
console.log('Application prête. API URL: ' + API_URL);
