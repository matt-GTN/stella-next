# agent/src/chart_theme.py

# Dictionnaire contenant toutes les préférences graphiques pour les graphiques de Stella.
stella_theme = {

    'colors': [
        '#C2185B',
        '#8B5CF6',
        '#FFB81C',
        '#8c564b', 
        '#2ca02c',  
        '#1f77b4',  
        '#e377c2',  
        '#d62728',  
        '#ff7f0e',  
    ],

    # Des couleurs spécifiques pour certaines métriques clés.
    # Utilisé pour le graphique  de synthèse.
    'metric_colors': {
        'roe': '#2ca02c',               # Le ROE est un signe de rentabilité -> Vert
        'debtToEquity': '#d62728',      # La dette est un risque -> Rouge
        'earningsYield': '#1f77b4',     # Le rendement est une info neutre -> Bleu
        'marginProfit': '#8B5CF6',      # La marge est une info de performance -> Violet (purple-500)
    },
    
    # Le modèle de base pour les graphiques.
    'template': 'plotly_white',
    
    # La police de caractères pour tous les textes du graphique.
    'font': {
        'family': 'Arial, sans-serif',
        'size': 12,
        'color': '#000000' # Couleur noire pour correspondre au texte des messages
    },
    
    # Configuration pour glassmorphism - fonds transparents
    'layout_defaults': {
        'paper_bgcolor': 'rgba(0,0,0,0)',  # Background du papier transparent
        'plot_bgcolor': 'rgba(0,0,0,0)'    # Background de la zone de plot transparent
        # Note: font configuration is handled by the top-level 'font' key to avoid conflicts
    },
    
    # Configuration des axes très fins et lisibles sur blanc
    'axis_config': {
        'gridcolor': '#E5E7EB',  # Grillage gris très clair (gray-200)
        'linecolor': '#9CA3AF',  # Ligne d'axe gris moyen (gray-400)
        'tickcolor': '#9CA3AF',  # Couleur des ticks gris moyen (gray-400)
        'zerolinecolor': '#6B7280',  # Ligne zéro gris plus foncé (gray-500)
        'gridwidth': 0.5,  # Grillage très fin
        'linewidth': 1,  # Lignes d'axe fines
        'tickwidth': 0.5  # Ticks très fins
    }
}
