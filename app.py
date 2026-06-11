"""
Péche Monitore - Backend Flask
Application de monitoring pour la gestion des activités de pêche
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

# Initialiser l'application Flask
app = Flask(__name__)
CORS(app)

# Fichier de stockage des données
DATA_FILE = 'data/sessions.json'

# Créer le dossier data s'il n'existe pas
os.makedirs('data', exist_ok=True)


def load_sessions():
    """Charger les sessions depuis le fichier JSON"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []


def save_sessions(sessions):
    """Sauvegarder les sessions dans le fichier JSON"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(sessions, f, ensure_ascii=False, indent=2)


# Routes

@app.route('/')
def index():
    """Page d'accueil"""
    return render_template('index.html')


@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Récupérer toutes les sessions de pêche"""
    sessions = load_sessions()
    return jsonify(sessions), 200


@app.route('/api/sessions', methods=['POST'])
def create_session():
    """Créer une nouvelle session de pêche"""
    try:
        data = request.json
        
        # Valider les données
        if not data.get('lieu') or not data.get('date'):
            return jsonify({'error': 'Les champs lieu et date sont obligatoires'}), 400
        
        # Créer la session
        session = {
            'id': len(load_sessions()) + 1,
            'lieu': data.get('lieu'),
            'date': data.get('date'),
            'heure_debut': data.get('heure_debut'),
            'heure_fin': data.get('heure_fin'),
            'especes': data.get('especes', []),
            'nombre_captures': data.get('nombre_captures', 0),
            'notes': data.get('notes', ''),
            'created_at': datetime.now().isoformat()
        }
        
        # Sauvegarder
        sessions = load_sessions()
        sessions.append(session)
        save_sessions(sessions)
        
        return jsonify(session), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Récupérer une session spécifique"""
    sessions = load_sessions()
    for session in sessions:
        if session['id'] == session_id:
            return jsonify(session), 200
    return jsonify({'error': 'Session non trouvée'}), 404


@app.route('/api/sessions/<int:session_id>', methods=['PUT'])
def update_session(session_id):
    """Mettre à jour une session"""
    try:
        sessions = load_sessions()
        for i, session in enumerate(sessions):
            if session['id'] == session_id:
                # Mettre à jour les champs fournis
                data = request.json
                session.update(data)
                sessions[i] = session
                save_sessions(sessions)
                return jsonify(session), 200
        
        return jsonify({'error': 'Session non trouvée'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Supprimer une session"""
    try:
        sessions = load_sessions()
        sessions = [s for s in sessions if s['id'] != session_id]
        save_sessions(sessions)
        return jsonify({'message': 'Session supprimée'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Récupérer les statistiques"""
    sessions = load_sessions()
    
    total_sessions = len(sessions)
    total_captures = sum(s.get('nombre_captures', 0) for s in sessions)
    
    # Espèces les plus capturées
    species_count = {}
    for session in sessions:
        for espece in session.get('especes', []):
            species_count[espece] = species_count.get(espece, 0) + 1
    
    stats = {
        'total_sessions': total_sessions,
        'total_captures': total_captures,
        'top_species': sorted(species_count.items(), key=lambda x: x[1], reverse=True)[:5]
    }
    
    return jsonify(stats), 200


@app.route('/health', methods=['GET'])
def health():
    """Vérifier que l'application fonctionne"""
    return jsonify({'status': 'ok', 'message': 'Péche Monitore is running!'}), 200


if __name__ == '__main__':
    print("🎣 Démarrage de Péche Monitore...")
    print("📍 Accédez à http://localhost:5000")
    app.run(debug=True, host='localhost', port=5000)
  
