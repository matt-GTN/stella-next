"use client";

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ModelingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Modeling component error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const { language = 'en' } = this.props;
      
      return (
        <div className="min-h-screen w-full relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50 to-pink-50"></div>
          
          <div className="relative z-20 h-screen flex items-center justify-center p-8">
            <div className="max-w-md w-full backdrop-blur-sm bg-white/10 border border-white/20 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {language === 'fr' ? 'Erreur de l\'application' : 'Application Error'}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {language === 'fr' 
                  ? 'Une erreur inattendue s\'est produite dans le composant de modélisation.'
                  : 'An unexpected error occurred in the modeling component.'
                }
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Recharger la page' : 'Reload Page'}</span>
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                >
                  {language === 'fr' ? 'Réessayer' : 'Try Again'}
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    {language === 'fr' ? 'Détails de l\'erreur' : 'Error Details'}
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModelingErrorBoundary;