"use client";

import { motion } from "motion/react";
import PingingDot from "./PingingDot";
import {
  Search,
  Download,
  BarChart3,
  TrendingUp,
  Database,
  Eye,
  FileText,
  Building2,
  Newspaper,
  Calculator,
  DollarSign,
  Settings,
  Wrench
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Mapping des noms d'outils vers leurs icônes correspondantes
const getToolIcon = (toolName) => {
  const iconMap = {
    // Outils de recherche et récupération
    'search_ticker': Search,
    'fetch_data': Download,

    // Outils d'analyse et de traitement  
    'preprocess_data': Settings,
    'analyze_risks': TrendingUp,
    'compare_stocks': BarChart3,

    // Outils d'affichage des données
    'display_raw_data': Database,
    'display_processed_data': Database,
    'display_price_chart': BarChart3,
    'create_dynamic_chart': BarChart3,

    // Outils d'information
    'get_stock_news': Newspaper,
    'get_company_profile': Building2,

    // Outils de calcul
    'calculate_financial_metrics': Calculator,
    'value_analysis': DollarSign,

    // Défaut
    'default': Settings
  };

  return iconMap[toolName] || iconMap.default;
};

// Mapping des noms d'outils vers des descriptions lisibles avec support multilingue
const getToolDescription = (toolName, language = 'en') => {
  const descriptions = {
    'search_ticker': {
      fr: 'Recherche de symbole boursier',
      en: 'Search Stock Ticker'
    },
    'fetch_data': {
      fr: 'Récupération des données financières',
      en: 'Fetch Financial Data'
    },
    'preprocess_data': {
      fr: 'Traitement des données',
      en: 'Process Data'
    },
    'analyze_risks': {
      fr: 'Analyse des risques',
      en: 'Risk Analysis'
    },
    'compare_stocks': {
      fr: 'Comparaison d\'actions',
      en: 'Compare Stocks'
    },
    'display_raw_data': {
      fr: 'Affichage des données brutes',
      en: 'Display Raw Data'
    },
    'display_processed_data': {
      fr: 'Affichage des données traitées',
      en: 'Display Processed Data'
    },
    'display_price_chart': {
      fr: 'Graphique des prix',
      en: 'Price Chart'
    },
    'create_dynamic_chart': {
      fr: 'Création de graphique personnalisé',
      en: 'Create Dynamic Chart'
    },
    'get_stock_news': {
      fr: 'Récupération des actualités',
      en: 'Get Stock News'
    },
    'get_company_profile': {
      fr: 'Profil de l\'entreprise',
      en: 'Company Profile'
    },
    'calculate_financial_metrics': {
      fr: 'Calcul des métriques financières',
      en: 'Calculate Financial Metrics'
    },
    'value_analysis': {
      fr: 'Analyse de valorisation',
      en: 'Value Analysis'
    }
  };

  const toolDesc = descriptions[toolName];
  if (toolDesc && toolDesc[language]) {
    return toolDesc[language];
  }
  
  // Fallback to tool name if no translation found
  return toolName;
};

// Rend chaque argument sous forme de "pill"
const renderArgPills = (args) => {
  if (!args || typeof args !== 'object') return null;
  const entries = Object.entries(args);
  if (entries.length === 0) return null;

  const toText = (value) => {
    if (value == null) return '—';
    if (typeof value === 'string') return value.length > 60 ? value.slice(0, 57) + '…' : value;
    if (Array.isArray(value)) return value.join(', ').slice(0, 60);
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + '…';
    return String(value);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="text-[11px] leading-4 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium"
          title={`${key}: ${toText(value)}`}
        >
          <span className="uppercase tracking-wide text-[10px] text-purple-600/80 mr-1">{key}:</span>
          <span className="font-semibold">{toText(value)}</span>
        </span>
      ))}
    </div>
  );
};

export default function ToolCall({ toolName, args = {} }) {
  const { language, t } = useLanguage();
  const IconComponent = getToolIcon(toolName);
  const description = getToolDescription(toolName, language);

  return (
    <motion.div
      className="my-2 p-3 bg-gray-100/80 backdrop-blur-sm border border-gray-200/60 rounded-xl relative"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex flex-row justify-between items-start space-x-3">
        {/* Icône de l'outil + contenu */}
        <div className="flex-row flex gap-3 items-start min-w-0">
          <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-4 h-4 text-white" />
          </div>

          {/* Contenu de l'appel d'outil */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-800">
              {description}
            </span>
            {/* Arguments sous le nom de l'outil */}
            {renderArgPills(args)}
          </div>
        </div>

        {/* Indicateur d'exécution */}
        <div className="flex flex-row items-center gap-3 justify-end flex-shrink-0">
          <div className="inline-grid *:[grid-area:1/1]">
            <div className="h-3 w-3 bg-purple-500 rounded-full "></div>
            <div className="h-3 w-3 bg-purple-500 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
      
      {/* "Outil appelé" indicator at bottom right */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        <Wrench className="w-3 h-3 text-gray-500" />
        <span className="text-[10px] text-gray-500 font-medium">
          {t('tools.called')}
        </span>
      </div>
    </motion.div>
  );
}
