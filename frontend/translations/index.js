export const translations = {
  fr: {
    navigation: {
      me: "À propos de moi",
      projects: "Projets",
      skills: "Compétences",
      beyondCode: "Au-delà du Code",
      contact: "Contact"
    },
    homepage: {
      greeting: "Hey, moi c'est Mathis 👋, je suis un",
      roles: [
        "Data Scientist",
        "Team Player",
        "Dev IA Agentique",
        "Learning Enthusiast"
      ]
    },
    content: {
      me: {
        introduction: {
          title: "Du management d'humains à l'entraînement de machines 🦾",
          subtitle: "5 ans à transformer des idées créatives en code, j'apprends maintenant à l'IA à être plus intelligente que moi"
        },
        values: [
          {
            title: "Leadership & Collaboration",
            description: "5 ans d'expérience en collaboration créative, leadership de projet et travail en environnements IT. J'ai managé une équipe de 8 personnes et restructuré la culture d'entreprise pour réengager les employés."
          },
          {
            title: "Innovation & IA",
            description: "Spécialisé dans les technos agentiques : LangChain, LangGraph, APIs LLM. J'adore les solutions combinant IA et analyse de données !"
          },
          {
            title: "Expertise Technique",
            description: "Maîtrise complète de la stack Data Science : Python, Machine Learning, Data Viz mais aussi IA Agentique et développement web moderne."
          }
        ],
        profile: [
          { text: '📍 Nantes, France', color: 'bg-red-400 hover:bg-red-500' },
          { text: '🎓 Data Scientist', color: 'bg-green-600 hover:bg-green-700' },
          { text: '💼 5 ans d\'expérience', color: 'bg-orange-600 hover:bg-orange-700' },
          { text: '🚗 Permis de conduire', color: 'bg-blue-600 hover:bg-blue-700' }
        ],
        languages: [
          { text: 'Anglais - C2', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'us' },
          { text: 'Italien - B2', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'it' },
          { text: 'Français - Natif', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'fr' }
        ],
        sections: {
          coreValues: "Valeurs",
          about: "À Propos",
          profile: "Profil",
          languages: "Langues",
          connect: "Échangeons 👋"
        },
        cta: {
          resume: "Télécharger le CV",
          linkedin: "LinkedIn"
        }
      },
      projects: {
        title: "Mes Projets",
        technologies: "Technologies",
        items: [
          {
            title: 'Stella',
            category: 'Agent de Gestion de risques Financiers',
            description: 'Agent analyste financier intelligent alimenté par LangGraph et Streamlit. Dispose de 12 outils spécialisés pour l\'analyse d\'actions, l\'évaluation des risques et la recherche de marché. Construit comme projet de fin d\'études en Data Science pour apporter notre modèle d\'apprentissage surpervisé en analyse financière fondamentale (et plus) à des utilisateurs non techniques.'
          },
          {
            title: 'Zenyth',
            category: 'Webapp alimentée par IA',
            description: 'Application alimentée par IA qui extrait, transcrit, résume et traduit le contenu vidéo YouTube. Dispose de résumés multi-niveaux, de traduction multilingue et de suivi de progression en temps réel, construite sur l\'orchestration de workflow LangGraph.'
          },
          {
            title: 'Portfolio',
            category: 'Vitrine Interactive de Développeur',
            description: 'Portfolio avec simulation Vanta.js, design UI glassmorphique et animations fluides. Construit avec Next.js App Router, et présente des projets via une navigation avec un design responsive.'
          }
        ]
      },
      skills: {
        title: "Compétences & Expertise",
        categories: {
          "Data Science & Analyse": ['Pandas', 'Numpy', 'Jupyter', 'Plotly', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'Keras', 'XGBoost', 'SciPy.stats', 'Statsmodels', 'SHAP', 'OpenCV', 'NLTK', 'Systèmes de recommandation', 'Imblearn', 'Prophet', 'TPOT'],
          "IA Agentique & Automation": ['LLMs', 'RAG', 'MCP', 'OpenRouter', 'Groq', 'LangChain', 'LangGraph', 'LangSmith', 'Context Engineering'],
          "Backend & Systèmes": ['SQL', 'Unix', 'C++', 'Python', 'Git', 'GitHub', 'Docker', 'FastAPI', 'Nginx', 'MLFlow', 'MongoDB', 'SQLAlchemy', 'IoT'],
          "Frontend & Prototypage": ['HTML', 'CSS', 'JavaScript', 'Next.js', 'React', 'Streamlit', 'Tailwind CSS', 'DaisyUI', 'Framer Motion'],
          "En cours d'apprentissage": ['AWS Cloud', 'PySpark', 'Tests unitaires', 'Clustering', 'Reinforcement Learning', 'Beautiful Soup', 'NetworkX', 'TensorFlow', 'PyTorch', 'Bases de données vectorielles']
        }
      },
      beyondCode: {
        title: "Au-delà du Code",
        introduction: {
          title: "🚀 Et après le code ?",
          content: "Bien que j'adore coder et mettre en place des solutions IA, je pense que les meilleurs développeurs sont ceux qui savent se passionner, au delà des écrans, aussi fort qu'ils codent."
        },
        hobbies: {
          title: "Passions & Loisirs",
          items: [
            {
              title: "Sports",
              description: "Mens sana in corpore sano. Que ce soit ma session quotidienne à la salle ou un nouveau sport à découvrir, j'adore de bouger arpès une journée de travail."
            },
            {
              title: "Jeux de société",
              description: "Jeux abstraits et titres thématiques, c'est mon truc. Mon passé de Game Designer m'a rendu accro aux mécaniques bien faîtes et aux défis qui font réfléchir."
            },
            {
              title: "Lecture",
              description: "Fantasy, articles tech et bouquins de philo, ma pile de lecture est éclectique. - Et c'est souvent dans ce mix que naissent les meilleurs projets."
            },
            {
              title: "Langues",
              description: "Nouvelles cultures, nouvelles langues - j'adore explorer. Une nouvelle façon de parler, c'est une nouvelle façon de penser."
            }
          ]
        },
        currentActivities: {
          title: "Mes dernières trouvailles",
          subtitle: "Des choses que je poursuis activement ou que j'ai récemment découvertes :",
          items: [
            { text: '🎾 Padel', color: 'bg-red-500 hover:bg-red-600' },
            { text: '📚 The Witcher', color: 'bg-amber-600 hover:bg-amber-700' },
            { text: '🐼 Panda Spin', color: 'bg-purple-600 hover:bg-purple-700' },
            { text: '🌱 Apprendre le Darija', color: 'bg-green-600 hover:bg-green-700' },
            { text: '📟 Gemini CLI', color: 'bg-blue-600 hover:bg-blue-700' },
            { text: '🍪 Pasticiotto al pistacchio', color: 'bg-orange-600 hover:bg-orange-700' }
          ]
        },
        travel: {
          title: "Voyages",
          subtitle: "Des endroits qui me donnent envie de faire mes valises :",
          wishlist: [
            { text: 'Japon', color: 'bg-pink-500 hover:bg-pink-600', countryCode: 'jp' },
            { text: 'Islande', color: 'bg-cyan-500 hover:bg-cyan-600', countryCode: 'is' },
            { text: 'Nouvelle-Zélande', color: 'bg-emerald-500 hover:bg-emerald-600', countryCode: 'nz' },
            { text: 'Canada', color: 'bg-red-500 hover:bg-red-600', countryCode: 'ca' }
          ]
        },
        achievement: {
          title: "🔥 Expérience la plus folle",
          description1: "Je me suis lancé dans un défi d'auto-stop en duo à travers le pays de Nantes à Séville. Mission inachevée, mais une leçon masterclass en résilience et prise de décision sous pression.",
          description2: "C'était une aventure inoubliable !"
        }
      },
      contact: {
        title: "Contact",
        work_together: "Travaillons ensemble",
        infos: "Infos de contact",
        message: "Envoyer un message",
        subtitle: "Toujours partant pour de nouveaux projets et opportunités intéressantes. Une question, une collab ou juste envie de discuter tech ? Écrivez-moi !",
        methods: [
          {
            label: "Email",
            value: "mathisgenthon@outlook.fr",
            type: "email"
          },
          {
            label: "LinkedIn",
            value: "mathis-genthon-9908102b6",
            type: "linkedin"
          },
          {
            label: "GitHub",
            value: "matt-GTN",
            type: "github"
          },
          {
            label: "Téléphone",
            value: "+33 6 29 19 57 41",
            type: "phone"
          }
        ],
        copySuccess: "Copié dans le presse-papiers !",
        copyError: "Erreur lors de la copie"
      },
      modeling: {
        title: "Modélisation Interactive",
        subtitle: "De la Prédiction au Filtrage de Risque",
        strategy: {
          title: "Stratégie de Modélisation Avancée",
          description: "Cette page vous permet d'explorer comment transformer un modèle de prédiction générale en un système de filtrage de risque de haute précision. Plutôt que de chercher à prédire parfaitement toutes les actions, nous nous concentrons sur l'identification fiable des actions à risque élevé.",
          traditional: {
            title: "Approche Traditionnelle",
            description: "Prédiction binaire pour toutes les actions avec une précision modérée (~73%). Utile pour une vue d'ensemble mais moins fiable pour des décisions critiques."
          },
          riskFiltering: {
            title: "Filtrage de Risque",
            description: "Sélection des prédictions à haute confiance pour atteindre >90% de précision sur l'identification des actions à risque. Moins de couverture, mais fiabilité maximale."
          },
          educational: {
            title: "Objectif Pédagogique",
            description: "Comprenez comment les hyperparamètres influencent les performances, explorez l'analyse de confiance pour le filtrage de risque, et découvrez l'explicabilité SHAP pour comprendre les décisions du modèle."
          }
        },
        hyperparameters: {
          title: "Configuration des Hyperparamètres",
          subtitle: "Ajustez les paramètres pour optimiser les performances",
          resetButton: "Valeurs Optimales",
          resetButtonShort: "Optimal",
          forestStructure: "Structure de la Forêt",
          splittingConditions: "Conditions de Division",
          currentConfig: "Configuration actuelle:",
          nEstimators: {
            label: "Nombre d'arbres (n_estimators)",
            help: "Plus d'arbres améliorent la stabilité mais augmentent le temps de calcul. Valeur optimale: 134"
          },
          maxDepth: {
            label: "Profondeur maximale (max_depth)",
            help: "Contrôle la complexité de chaque arbre. Trop élevé = surapprentissage. Valeur optimale: 10"
          },
          minSamplesLeaf: {
            label: "Échantillons min. par feuille (min_samples_leaf)",
            help: "Évite les divisions sur de petits échantillons. Plus élevé = moins de surapprentissage. Valeur optimale: 1"
          },
          maxFeatures: {
            label: "Caractéristiques max. (max_features)",
            help: "Nombre de caractéristiques considérées pour chaque division. 'log2' est optimal pour ce dataset."
          },
          criterion: {
            label: "Critère de division (criterion)",
            help: "Mesure de qualité des divisions. Entropy est optimal pour ce problème de classification."
          }
        },
        training: {
          button: "Entraîner le Modèle",
          buttonTraining: "Entraînement...",
          progress: {
            initializing: "Initialisation...",
            loadingData: "Chargement des données...",
            training: "Entraînement du modèle...",
            processing: "Traitement des résultats...",
            complete: "Terminé!"
          },
          error: {
            title: "Erreur d'entraînement",
            timeout: "L'entraînement a pris trop de temps. Essayez avec moins d'arbres.",
            network: "Impossible de se connecter au serveur. Vérifiez que le backend est démarré.",
            retry: "Réessayer"
          },
          newTraining: "Nouvel entraînement"
        },
        results: {
          overallPerformance: "Performance Globale",
          overallPerformanceSubtitle: "Métriques générales du modèle",
          overallAccuracy: "Précision Globale",
          macroF1: "F1-Score Macro",
          weightedF1: "F1-Score Pondéré",
          confusionMatrix: "Matrice de Confusion",
          confusionMatrixSubtitle: "Prédictions vs réalité",
          featureImportance: "Importance des Variables",
          featureImportanceSubtitle: "Top 15 des facteurs les plus influents",
          class0: "Classe 0 - Sous-performance",
          class0Subtitle: "Actions à risque élevé",
          class1: "Classe 1 - Sur-performance",
          class1Subtitle: "Actions performantes",
          precision: "Précision",
          recall: "Rappel",
          support: "Support",
          truePositives: "Vrais Positifs",
          errors: "Erreurs",
          mainDiagonal: "Diagonale principale",
          offDiagonal: "Hors diagonale",
          interpretation: "Interprétation",
          featureImportanceDescription: "Les variables avec les scores d'importance les plus élevés ont le plus d'influence sur les prédictions du modèle. Ces métriques financières sont cruciales pour identifier les actions à risque.",
          performanceAnalysis: "Analyse des Performances"
        },
        confidence: {
          title: "Analyse par Confiance",
          subtitle: "Filtrage de risque haute précision",
          description: "Ajustez le seuil de confiance pour transformer le modèle en filtre de risque. Plus le seuil est élevé, plus la précision augmente, mais la couverture diminue.",
          threshold: "Seuil de Confiance",
          thresholdSubtitle: "Ajustement en temps réel",
          thresholdLabel: "Seuil de confiance minimum",
          thresholdHelp: "Seules les prédictions avec une confiance supérieure à ce seuil seront conservées",
          highConfidencePredictions: "Prédictions Haute Confiance",
          coverage: "Couverture",
          filteredAccuracy: "Précision Filtrée",
          improvement: "Amélioration",
          outOf: "sur",
          totalDataset: "du dataset total",
          highConfidence: "haute confiance",
          vsOverallModel: "vs modèle global",
          highConfidenceMatrix: "Matrice de Confusion - Haute Confiance",
          overallPerformance: "Performance Globale",
          filteredPerformance: "Performance Filtrée",
          allPredictions: "Toutes les prédictions",
          highConfidenceOnly: "Haute confiance uniquement",
          accuracy: "Précision:",
          strategicInsights: "Insights Stratégiques",
          strategicInsightsSubtitle: "Valeur du filtrage par confiance",
          adaptiveStrategy: "Stratégie de Filtrage Adaptatif",
          businessAdvantage: "Avantage Commercial",
          businessAdvantageDescription: "En se concentrant sur les prédictions haute confiance, nous créons un système d'alerte précoce fiable pour identifier les actions à risque élevé.",
          coveragePrecisionTradeoff: "Compromis Couverture-Précision",
          understandingFiltering: "Comprendre le Filtrage par Confiance",
          highPrecision: "Haute Précision",
          highPrecisionDescription: "Les prédictions haute confiance sont plus fiables pour les décisions critiques",
          reducedCoverage: "Couverture Réduite",
          reducedCoverageDescription: "Moins d'actions analysées mais avec une confiance maximale",
          optimalBalance: "Équilibre Optimal",
          optimalBalanceDescription: "Ajustez le seuil selon vos besoins de précision vs couverture",
          strategicRecommendations: "Recommandations Stratégiques",
          optimalConfiguration: "Configuration Optimale",
          optimalConfigurationDescription: "Excellent équilibre entre précision et couverture pour un système d'alerte fiable.",
          thresholdTooRestrictive: "Seuil Trop Restrictif",
          noHighConfidencePredictions: "Aucune prédiction n'atteint ce niveau de confiance. Réduisez le seuil pour voir les insights.",
          tryThresholdRange: "Essayez un seuil entre 50% et 80% pour des résultats optimaux"
        },
        shap: {
          title: "Analyse SHAP",
          subtitle: "Explicabilité des décisions du modèle",
          description: "Explorez pourquoi le modèle fait des erreurs sur les prédictions haute confiance et découvrez l'archétype des entreprises à risque.",
          errorCaseSelection: "Sélection des Cas d'Erreur",
          errorCaseSelectionSubtitle: "Analysez les erreurs haute confiance",
          waterfallPlot: "Graphique en Cascade SHAP",
          waterfallPlotSubtitle: "Contributions des variables à la prédiction",
          archetypeInsights: "Insights sur l'Archétype",
          archetypeInsightsSubtitle: "Profil des entreprises à risque selon le modèle",
          noErrorCases: "Aucun cas d'erreur haute confiance disponible",
          noErrorCasesDescription: "Le modèle n'a pas fait d'erreurs sur les prédictions haute confiance avec le seuil actuel.",
          selectErrorCase: "Sélectionner un cas d'erreur",
          analyzing: "Analyse en cours...",
          company: "Entreprise",
          predicted: "Prédit",
          actual: "Réel",
          confidence: "Confiance",
          featureContributions: "Contributions des Variables",
          positiveContribution: "Contribution positive",
          negativeContribution: "Contribution négative",
          baseValue: "Valeur de base",
          finalPrediction: "Prédiction finale"
        },
        formatters: {
          percentage: (value) => `${(value * 100).toFixed(1)}%`,
          number: (value) => value.toLocaleString('fr-FR'),
          decimal: (value) => value.toFixed(2)
        }
      }
    },
    common: {
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      close: "Fermer",
      cta: "Travaillons ensemble !",
      work_together: "Travaillons ensemble",
      contact: "Infos de contact"
    }
  },
  en: {
    navigation: {
      me: "About me",
      projects: "Projects",
      skills: "Skills",
      beyondCode: "Beyond Code",
      contact: "Contact"
    },
    homepage: {
      greeting: "Hey, I'm Mathis 👋, I'm a",
      roles: [
        "Data Scientist",
        "Team Player",
        "Agentic AI Dev",
        "Learning Enthusiast"
      ]
    },
    content: {
      me: {
        introduction: {
          title: "From managing humans to training machines 🦾",
          subtitle: "5 years turning creative ideas into code, now teaching AI to be smarter than me"
        },
        values: [
          {
            title: "Leadership & Collaboration",
            description: "5 years of creative collaboration, project leadership, and IT environments. I've managed a team of 8 people and restructured company culture to re-engage employees."
          },
          {
            title: "Innovation & AI",
            description: "Specialized in agentic technologies: LangChain, LangGraph, LLM APIs. I love solutions combining AI and data analysis!"
          },
          {
            title: "Technical Expertise",
            description: "Complete mastery of the Data Science stack: Python, Machine Learning, Data Viz, plus Agentic AI and modern web development."
          }
        ],
        profile: [
          { text: '📍 Nantes, France', color: 'bg-red-400 hover:bg-red-500' },
          { text: '🎓 Data Scientist', color: 'bg-green-600 hover:bg-green-700' },
          { text: '💼 5 years experience', color: 'bg-orange-600 hover:bg-orange-700' },
          { text: '🚗 Driving License', color: 'bg-blue-600 hover:bg-blue-700' }
        ],
        languages: [
          { text: 'English - C2', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'us' },
          { text: 'Italian - B2', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'it' },
          { text: 'French - Native', color: 'bg-indigo-600 hover:bg-indigo-700', countryCode: 'fr' }
        ],
        sections: {
          coreValues: "Core Values",
          about: "About",
          profile: "Profile",
          languages: "Languages",
          connect: "Let's Connect 👋"
        },
        cta: {
          resume: "Download Resume",
          linkedin: "LinkedIn"
        }
      },
      projects: {
        title: "My Projects",
        technologies: "Technologies",
        items: [
          {
            title: 'Stella',
            category: 'Agentic Financial Assistant',
            description: 'Intelligent financial analyst agent powered by LangGraph and Streamlit. Features 12 specialized tools for stock analysis, risk assessment, and market research. Built as a Data Science capstone project to bring our supervised learning model of fundamental financial analysis to non-technical users.'
          },
          {
            title: 'Zenyth',
            category: 'AI-Powered Webapp',
            description: 'AI-powered application that extracts, transcribes, summarizes and translates YouTube video content. Features multi-level summaries, multilingual translation, and real-time progress tracking, built on LangGraph workflow orchestration.'
          },
          {
            title: 'Portfolio',
            category: 'Interactive Developer Showcase',
            description: 'Portfolio with backgrounds using Vanta.js simulation, glassmorphic UI design, and smooth animations. Built with Next.js App Router, showcasing projects through navigation with responsive design.'
          }
        ]
      },
      skills: {
        title: "Skills & Expertise",
        categories: {
          "Data Science & Analytics": ['Pandas', 'Numpy', 'Jupyter', 'Plotly', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'Keras', 'XGBoost', 'SciPy.stats', 'Statsmodels', 'SHAP', 'OpenCV', 'NLTK', 'Recommender Systems', 'Imblearn', 'Prophet', 'TPOT'],
          "Agentic AI & Automation": ['LLMs', 'RAG', 'MCP', 'OpenRouter', 'Groq', 'LangChain', 'LangGraph', 'LangSmith', 'Context Engineering'],
          "Backend & Systems": ['SQL', 'Unix', 'C++', 'Python', 'Git', 'GitHub', 'Docker', 'FastAPI', 'Nginx', 'MLFlow', 'MongoDB', 'SQLAlchemy', 'IoT'],
          "Frontend & Prototyping": ['HTML', 'CSS', 'JavaScript', 'Next.js', 'React', 'Streamlit', 'Tailwind CSS', 'DaisyUI', 'Framer Motion'],
          "Currently Learning": ['AWS Cloud', 'PySpark', 'Unit Tests', 'Clustering', 'Reinforcement Learning', 'Beautiful Soup', 'NetworkX', 'TensorFlow', 'PyTorch', 'Vector Databases']
        }
      },
      beyondCode: {
        title: "Beyond Code",
        introduction: {
          title: "🚀 Life Beyond the Screen",
          content: "While I love crafting code and building AI solutions, I believe the best developers are well-rounded individuals."
        },
        hobbies: {
          title: "Passions & Hobbies",
          items: [
            {
              title: "Sports",
              description: "Mens sana in corpore sano. Whether it's my daily gym session or discovering a new sport, I love moving after a coding day."
            },
            {
              title: "Board games",
              description: "Abstract games and thematic titles, that's my thing. My Game Designer background made me addicted to well-crafted mechanics and challenges that make you think."
            },
            {
              title: "Reading",
              description: "Fantasy, tech articles and philosophy books, my reading pile is all over the place. And it's often in this mix that the best projects are born."
            },
            {
              title: "Languages",
              description: "New cultures, new languages - I love exploring. A new way to speak is a new way to think."
            }
          ]
        },
        currentActivities: {
          title: "Currently Into",
          subtitle: "Things I'm actively pursuing or recently discovered:",
          items: [
            { text: '🎾 Padel', color: 'bg-red-500 hover:bg-red-600' },
            { text: '📚 The Witcher', color: 'bg-amber-600 hover:bg-amber-700' },
            { text: '🐼 Panda Spin', color: 'bg-purple-600 hover:bg-purple-700' },
            { text: '🌱 Learning Darija', color: 'bg-green-600 hover:bg-green-700' },
            { text: '📟 Gemini CLI', color: 'bg-blue-600 hover:bg-blue-700' },
            { text: '🍪 Pasticiotto al pistacchio', color: 'bg-orange-600 hover:bg-orange-700' }
          ]
        },
        travel: {
          title: "Travel",
          subtitle: "Places that make me want to pack my bags:",
          wishlist: [
            { text: 'Japan', color: 'bg-pink-500 hover:bg-pink-600', countryCode: 'jp' },
            { text: 'Iceland', color: 'bg-cyan-500 hover:bg-cyan-600', countryCode: 'is' },
            { text: 'New Zealand', color: 'bg-emerald-500 hover:bg-emerald-600', countryCode: 'nz' },
            { text: 'Canada', color: 'bg-red-500 hover:bg-red-600', countryCode: 'ca' }
          ]
        },
        achievement: {
          title: "🔥 Craziest experience",
          description1: "I embarked on a duo hitchhiking challenge across the country from Nantes to Sevilla. Mission unfinished, but a masterclass lesson in resilience and under pressure decision-making.",
          description2: "This was truly the craziest experience of my life!"
        }
      },
      contact: {
        title: "Contact",
        work_together: "Let's Work Together",
        infos: "Get in Touch",
        message: "Send Message",
        subtitle: "I'm always interested in new opportunities and exciting projects. Whether you have a question, want to collaborate, or just want to say hi, feel free to reach out!",
        methods: [
          {
            label: "Email",
            value: "mathisgenthon@outlook.fr",
            type: "email"
          },
          {
            label: "LinkedIn",
            value: "mathis-genthon-9908102b6",
            type: "linkedin"
          },
          {
            label: "GitHub",
            value: "matt-GTN",
            type: "github"
          },
          {
            label: "Phone",
            value: "+33 6 29 19 57 41",
            type: "phone"
          }
        ],
        copySuccess: "Copied to clipboard!",
        copyError: "Copy failed"
      },
      modeling: {
        title: "Interactive Modeling",
        subtitle: "From Prediction to Risk Filtering",
        strategy: {
          title: "Advanced Modeling Strategy",
          description: "This page allows you to explore how to transform a general prediction model into a high-precision risk filtering system. Rather than trying to perfectly predict all stocks, we focus on reliably identifying high-risk stocks.",
          traditional: {
            title: "Traditional Approach",
            description: "Binary prediction for all stocks with moderate accuracy (~73%). Useful for overview but less reliable for critical decisions."
          },
          riskFiltering: {
            title: "Risk Filtering",
            description: "Selection of high-confidence predictions to achieve >90% accuracy in identifying risky stocks. Less coverage, but maximum reliability."
          },
          educational: {
            title: "Educational Objective",
            description: "Understand how hyperparameters influence performance, explore confidence analysis for risk filtering, and discover SHAP explainability to understand model decisions."
          }
        },
        hyperparameters: {
          title: "Hyperparameter Configuration",
          subtitle: "Adjust parameters to optimize performance",
          resetButton: "Reset to Optimal",
          resetButtonShort: "Reset",
          forestStructure: "Forest Structure",
          splittingConditions: "Splitting Conditions",
          currentConfig: "Current configuration:",
          nEstimators: {
            label: "Number of trees (n_estimators)",
            help: "More trees improve stability but increase computation time. Optimal value: 134"
          },
          maxDepth: {
            label: "Maximum depth (max_depth)",
            help: "Controls the complexity of each tree. Too high = overfitting. Optimal value: 10"
          },
          minSamplesLeaf: {
            label: "Min. samples per leaf (min_samples_leaf)",
            help: "Prevents splits on small samples. Higher = less overfitting. Optimal value: 1"
          },
          maxFeatures: {
            label: "Max. features (max_features)",
            help: "Number of features considered for each split. 'log2' is optimal for this dataset."
          },
          criterion: {
            label: "Splitting criterion (criterion)",
            help: "Measure of split quality. Entropy is optimal for this classification problem."
          }
        },
        training: {
          button: "Train Model",
          buttonTraining: "Training...",
          progress: {
            initializing: "Initializing...",
            loadingData: "Loading data...",
            training: "Training model...",
            processing: "Processing results...",
            complete: "Complete!"
          },
          error: {
            title: "Training Error",
            timeout: "Training took too long. Try with fewer trees.",
            network: "Cannot connect to server. Please check that the backend is running.",
            retry: "Retry"
          },
          newTraining: "New training"
        },
        results: {
          overallPerformance: "Overall Performance",
          overallPerformanceSubtitle: "General model metrics",
          overallAccuracy: "Overall Accuracy",
          macroF1: "Macro F1-Score",
          weightedF1: "Weighted F1-Score",
          confusionMatrix: "Confusion Matrix",
          confusionMatrixSubtitle: "Predictions vs reality",
          featureImportance: "Feature Importance",
          featureImportanceSubtitle: "Top 15 most influential factors",
          class0: "Class 0 - Under-performing",
          class0Subtitle: "High-risk stocks",
          class1: "Class 1 - Out-performing",
          class1Subtitle: "High-performing stocks",
          precision: "Precision",
          recall: "Recall",
          support: "Support",
          truePositives: "True Positives",
          errors: "Errors",
          mainDiagonal: "Main diagonal",
          offDiagonal: "Off diagonal",
          interpretation: "Interpretation",
          featureImportanceDescription: "Features with the highest importance scores have the most influence on the model's predictions. These financial metrics are crucial for identifying risky stocks.",
          performanceAnalysis: "Performance Analysis"
        },
        confidence: {
          title: "Confidence-Based Analysis",
          subtitle: "High-precision risk filtering",
          description: "Adjust the confidence threshold to transform the model into a risk filter. Higher thresholds increase precision but reduce coverage.",
          threshold: "Confidence Threshold",
          thresholdSubtitle: "Real-time adjustment",
          thresholdLabel: "Minimum confidence threshold",
          thresholdHelp: "Only predictions with confidence above this threshold will be kept",
          highConfidencePredictions: "High-Confidence Predictions",
          coverage: "Coverage",
          filteredAccuracy: "Filtered Accuracy",
          improvement: "Improvement",
          outOf: "out of",
          totalDataset: "of total dataset",
          highConfidence: "high confidence",
          vsOverallModel: "vs overall model",
          highConfidenceMatrix: "High-Confidence Confusion Matrix",
          overallPerformance: "Overall Performance",
          filteredPerformance: "Filtered Performance",
          allPredictions: "All predictions",
          highConfidenceOnly: "High confidence only",
          accuracy: "Accuracy:",
          strategicInsights: "Strategic Insights",
          strategicInsightsSubtitle: "Value of confidence filtering",
          adaptiveStrategy: "Adaptive Filtering Strategy",
          businessAdvantage: "Business Advantage",
          businessAdvantageDescription: "By focusing on high-confidence predictions, we create a reliable early warning system for identifying high-risk stocks.",
          coveragePrecisionTradeoff: "Coverage-Precision Trade-off",
          understandingFiltering: "Understanding Confidence Filtering",
          highPrecision: "High Precision",
          highPrecisionDescription: "High-confidence predictions are more reliable for critical decisions",
          reducedCoverage: "Reduced Coverage",
          reducedCoverageDescription: "Fewer stocks analyzed but with maximum confidence",
          optimalBalance: "Optimal Balance",
          optimalBalanceDescription: "Adjust threshold based on your precision vs coverage needs",
          strategicRecommendations: "Strategic Recommendations",
          optimalConfiguration: "Optimal Configuration",
          optimalConfigurationDescription: "Excellent balance between precision and coverage for a reliable alert system.",
          thresholdTooRestrictive: "Threshold Too Restrictive",
          noHighConfidencePredictions: "No predictions reach this confidence level. Lower the threshold to see insights.",
          tryThresholdRange: "Try a threshold between 50% and 80% for optimal results"
        },
        shap: {
          title: "SHAP Analysis",
          subtitle: "Model decision explainability",
          description: "Explore why the model makes errors on high-confidence predictions and discover the archetype of risky companies.",
          errorCaseSelection: "Error Case Selection",
          errorCaseSelectionSubtitle: "Analyze high-confidence errors",
          waterfallPlot: "SHAP Waterfall Plot",
          waterfallPlotSubtitle: "Feature contributions to prediction",
          archetypeInsights: "Archetype Insights",
          archetypeInsightsSubtitle: "Profile of risky companies according to the model",
          noErrorCases: "No high-confidence error cases available",
          noErrorCasesDescription: "The model made no errors on high-confidence predictions with the current threshold.",
          selectErrorCase: "Select an error case",
          analyzing: "Analyzing...",
          company: "Company",
          predicted: "Predicted",
          actual: "Actual",
          confidence: "Confidence",
          featureContributions: "Feature Contributions",
          positiveContribution: "Positive contribution",
          negativeContribution: "Negative contribution",
          baseValue: "Base value",
          finalPrediction: "Final prediction"
        },
        formatters: {
          percentage: (value) => `${(value * 100).toFixed(1)}%`,
          number: (value) => value.toLocaleString('en-US'),
          decimal: (value) => value.toFixed(2)
        }
      }
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      close: "Close",
      cta: "Let's work together !",
    }
  }
};
