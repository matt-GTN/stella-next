# src/display_utils.py
"""
Module utilitaire pour l'affichage des DataFrames et graphiques Plotly
Gère l'affichage dans le terminal, la sauvegarde en fichiers, etc.
"""

import pandas as pd
import plotly.io as pio
import plotly.graph_objects as go
import json
import os
from io import StringIO
from typing import Optional, Union, Dict, Any
from datetime import datetime
import sys

class DisplayManager:
    """Gestionnaire centralisé pour l'affichage des données et visualisations"""
    
    def __init__(self, output_dir: str = "outputs", save_files: bool = True, display_in_terminal: bool = True):
        """
        Initialise le gestionnaire d'affichage
        
        Args:
            output_dir (str): Répertoire de sauvegarde des fichiers
            save_files (bool): Si True, sauvegarde les fichiers sur disque
            display_in_terminal (bool): Si True, affiche les données dans le terminal
        """
        self.output_dir = output_dir
        self.save_files = save_files
        self.display_in_terminal = display_in_terminal
        
        # Créer le répertoire de sortie s'il n'existe pas
        if self.save_files and not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def display_dataframe(self, df_json: str, title: str = "DataFrame", source: str = "agent") -> str:
        """
        Affiche un DataFrame depuis son format JSON
        
        Args:
            df_json (str): DataFrame au format JSON (orient='split')
            title (str): Titre pour l'affichage
            source (str): Source des données (pour le nommage des fichiers)
            
        Returns:
            str: Message de confirmation ou d'erreur
        """
        try:
            # Charger le DataFrame depuis le JSON
            df = pd.read_json(StringIO(df_json), orient='split')
            
            if self.display_in_terminal:
                self._display_dataframe_terminal(df, title)
            
            if self.save_files:
                filename = self._save_dataframe_to_file(df, title, source)
                return f"✅ DataFrame affiché avec succès. Sauvegardé dans: {filename}"
            else:
                return "✅ DataFrame affiché avec succès."
                
        except Exception as e:
            error_msg = f"❌ Erreur lors de l'affichage du DataFrame: {str(e)}"
            print(error_msg)
            return error_msg
    
    def display_plotly_chart(self, plotly_json: str, title: str = "Graphique", source: str = "agent") -> str:
        """
        Affiche et sauvegarde un graphique Plotly depuis son format JSON
        
        Args:
            plotly_json (str): Graphique au format JSON Plotly
            title (str): Titre pour l'affichage
            source (str): Source du graphique (pour le nommage des fichiers)
            
        Returns:
            str: Message de confirmation ou d'erreur
        """
        try:
            # Charger le graphique depuis le JSON
            fig = pio.from_json(plotly_json)
            
            if self.display_in_terminal:
                self._display_plotly_terminal(fig, title)
            
            if self.save_files:
                filename = self._save_plotly_to_file(fig, title, source)
                return f"✅ Graphique affiché avec succès. Sauvegardé dans: {filename}"
            else:
                return "✅ Graphique affiché avec succès."
                
        except Exception as e:
            error_msg = f"❌ Erreur lors de l'affichage du graphique: {str(e)}"
            print(error_msg)
            return error_msg
    
    def _display_dataframe_terminal(self, df: pd.DataFrame, title: str):
        """Affiche un DataFrame dans le terminal avec un formatage amélioré"""
        print(f"\n{'='*60}")
        print(f"📊 {title.upper()}")
        print(f"{'='*60}")
        print(f"📐 Dimensions: {df.shape[0]} lignes × {df.shape[1]} colonnes")
        print(f"📅 Affiché le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60)
        
        # Affichage adaptatif selon la taille
        if len(df) > 20:
            print("🔍 Aperçu des données (premières et dernières 10 lignes):")
            print("\n📋 PREMIÈRES LIGNES:")
            print(df.head(10).to_string(index=True))
            print("\n📋 DERNIÈRES LIGNES:")
            print(df.tail(10).to_string(index=True))
        else:
            print("📋 DONNÉES COMPLÈTES:")
            print(df.to_string(index=True))
        
        # Informations sur les colonnes
        print(f"\n📝 COLONNES ({len(df.columns)}):")
        for i, col in enumerate(df.columns, 1):
            dtype = df[col].dtype
            null_count = df[col].isnull().sum()
            print(f"  {i:2d}. {col:<30} | Type: {dtype:<10} | Nulls: {null_count}")
        
        print(f"{'='*60}\n")
    
    def _display_plotly_terminal(self, fig: go.Figure, title: str):
        """Affiche des informations sur le graphique Plotly dans le terminal"""
        print(f"\n{'='*60}")
        print(f"📈 {title.upper()}")
        print(f"{'='*60}")
        
        # Informations de base sur le graphique
        layout = fig.layout
        print(f"📊 Titre du graphique: {layout.title.text if layout.title else 'Non défini'}")
        print(f"📅 Créé le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎨 Nombre de traces: {len(fig.data)}")
        
        # Informations sur les traces
        for i, trace in enumerate(fig.data, 1):
            trace_name = getattr(trace, 'name', f'Trace {i}')
            trace_type = trace.type
            print(f"  {i}. {trace_name} (Type: {trace_type})")
        
        # Informations sur les axes
        if layout.xaxis and layout.xaxis.title:
            print(f"📐 Axe X: {layout.xaxis.title.text}")
        if layout.yaxis and layout.yaxis.title:
            print(f"📐 Axe Y: {layout.yaxis.title.text}")
        
        print(f"{'='*60}\n")
    
    def _save_dataframe_to_file(self, df: pd.DataFrame, title: str, source: str) -> str:
        """Sauvegarde un DataFrame dans un fichier CSV et HTML"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = self._make_filename_safe(title)
        
        # Sauvegarde en CSV
        csv_filename = f"{safe_title}_{source}_{timestamp}.csv"
        csv_path = os.path.join(self.output_dir, csv_filename)
        df.to_csv(csv_path, index=True)
        
        # Sauvegarde en HTML pour un affichage plus riche
        html_filename = f"{safe_title}_{source}_{timestamp}.html"
        html_path = os.path.join(self.output_dir, html_filename)
        
        # Créer un HTML avec style personnalisé
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #2c3e50; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #3498db; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
                .info {{ background-color: #e8f4f8; padding: 10px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <h1>{title}</h1>
            <div class="info">
                <strong>Généré le:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
                <strong>Dimensions:</strong> {df.shape[0]} lignes × {df.shape[1]} colonnes<br>
                <strong>Source:</strong> {source}
            </div>
            {df.to_html(classes='data', table_id='dataframe')}
        </body>
        </html>
        """
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return f"{csv_filename} et {html_filename}"
    
    def _save_plotly_to_file(self, fig: go.Figure, title: str, source: str) -> str:
        """Sauvegarde un graphique Plotly en PNG et HTML"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = self._make_filename_safe(title)
        
        # Sauvegarde en PNG
        png_filename = f"{safe_title}_{source}_{timestamp}.png"
        png_path = os.path.join(self.output_dir, png_filename)
        fig.write_image(png_path, width=1200, height=800, scale=2)
        
        # Sauvegarde en HTML interactif
        html_filename = f"{safe_title}_{source}_{timestamp}.html"
        html_path = os.path.join(self.output_dir, html_filename)
        fig.write_html(html_path)
        
        return f"{png_filename} et {html_filename}"
    
    def _make_filename_safe(self, filename: str) -> str:
        """Convertit une chaîne en nom de fichier sûr"""
        # Remplace les caractères spéciaux par des underscores
        safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
        safe_filename = ''.join(c if c in safe_chars else '_' for c in filename)
        # Supprime les underscores multiples et ceux en début/fin
        safe_filename = '_'.join(part for part in safe_filename.split('_') if part)
        return safe_filename[:50]  # Limite la longueur
    
    def display_message_data(self, message, message_type: str = "unknown") -> Dict[str, str]:
        """
        Affiche automatiquement toutes les données attachées à un message
        
        Args:
            message: Message AI avec des données attachées
            message_type (str): Type du message pour le contexte
            
        Returns:
            Dict[str, str]: Dictionnaire des fichiers créés ou messages d'erreur
        """
        results = {}
        
        # Vérifier et afficher le DataFrame
        if hasattr(message, 'dataframe_json') and message.dataframe_json:
            results['dataframe'] = self.display_dataframe(
                message.dataframe_json, 
                title=f"DataFrame - {message_type}", 
                source=message_type
            )
        
        # Vérifier et afficher le graphique Plotly
        if hasattr(message, 'plotly_json') and message.plotly_json:
            results['chart'] = self.display_plotly_chart(
                message.plotly_json, 
                title=f"Graphique - {message_type}", 
                source=message_type
            )
        
        # Vérifier et afficher les actualités (formatage spécial)
        if hasattr(message, 'news_json') and message.news_json:
            results['news'] = self._display_news_data(message.news_json, message_type)
        
        # Vérifier et afficher le profil d'entreprise
        if hasattr(message, 'profile_json') and message.profile_json:
            results['profile'] = self._display_profile_data(message.profile_json, message_type)
        
        # Afficher le texte explicatif s'il existe
        if hasattr(message, 'explanation_text') and message.explanation_text:
            if self.display_in_terminal:
                print(f"\n{message.explanation_text}")
        
        return results
    
    def _display_news_data(self, news_json: str, source: str) -> str:
        """Affiche les données d'actualités"""
        try:
            if self.display_in_terminal:
                print(f"\n{'='*60}")
                print("📰 ACTUALITÉS")
                print(f"{'='*60}")
                print(news_json)
                print(f"{'='*60}\n")
            
            # Sauvegarder si demandé
            if self.save_files:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"actualites_{source}_{timestamp}.txt"
                filepath = os.path.join(self.output_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(f"Actualités - {source}\n")
                    f.write(f"Généré le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write("="*60 + "\n\n")
                    f.write(news_json)
                return f"✅ Actualités affichées. Sauvegardées dans: {filename}"
            
            return "✅ Actualités affichées."
        
        except Exception as e:
            error_msg = f"❌ Erreur lors de l'affichage des actualités: {str(e)}"
            print(error_msg)
            return error_msg
    
    def _display_profile_data(self, profile_json: str, source: str) -> str:
        """Affiche les données de profil d'entreprise"""
        try:
            if self.display_in_terminal:
                print(f"\n{'='*60}")
                print("🏢 PROFIL D'ENTREPRISE")
                print(f"{'='*60}")
                
                # Tenter de parser le JSON pour un affichage plus structuré
                try:
                    profile_data = json.loads(profile_json)
                    for key, value in profile_data.items():
                        if value and value != "null":
                            print(f"📋 {key.replace('_', ' ').title()}: {value}")
                except:
                    # Si le parsing échoue, afficher le texte brut
                    print(profile_json)
                
                print(f"{'='*60}\n")
            
            # Sauvegarder si demandé
            if self.save_files:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"profil_entreprise_{source}_{timestamp}.json"
                filepath = os.path.join(self.output_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(profile_json)
                return f"✅ Profil d'entreprise affiché. Sauvegardé dans: {filename}"
            
            return "✅ Profil d'entreprise affiché."
        
        except Exception as e:
            error_msg = f"❌ Erreur lors de l'affichage du profil: {str(e)}"
            print(error_msg)
            return error_msg


# Instance globale pour utilisation facile
display_manager = DisplayManager()

# Fonctions de commodité
def display_dataframe(df_json: str, title: str = "DataFrame", source: str = "agent") -> str:
    """Fonction de commodité pour afficher un DataFrame"""
    return display_manager.display_dataframe(df_json, title, source)

def display_plotly_chart(plotly_json: str, title: str = "Graphique", source: str = "agent") -> str:
    """Fonction de commodité pour afficher un graphique Plotly"""
    return display_manager.display_plotly_chart(plotly_json, title, source)

def display_message_data(message, message_type: str = "unknown") -> Dict[str, str]:
    """Fonction de commodité pour afficher toutes les données d'un message"""
    return display_manager.display_message_data(message, message_type)

def set_display_options(save_files: bool = True, display_in_terminal: bool = True, output_dir: str = "outputs"):
    """Configure les options d'affichage globales"""
    global display_manager
    display_manager = DisplayManager(output_dir, save_files, display_in_terminal)
