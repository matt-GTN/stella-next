"use client";

import { memo, useMemo } from "react";
import { 
  Building2, 
  Factory, 
  TrendingUp, 
  Globe, 
  DollarSign, 
  ExternalLink 
} from "lucide-react";

function CompanyProfile({ profileJson }) {
  const profile = useMemo(() => {
    try {
      const obj = typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson;
      return obj || {};
    } catch (e) {
      console.error("Failed to parse profile JSON:", e);
      return {};
    }
  }, [profileJson]);

  const { name, ticker, description, sector, industry, website, logo, country, currency, exchange } = profile;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-3 text-sm font-semibold bg-gradient-to-r from-purple-400 to-purple-600 text-white border-b">Profil d'entreprise</div>
      <div className="p-4">
        <div className="flex gap-4 items-start mb-4">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`${name || ticker} logo`} className="w-16 h-16 rounded-lg border border-gray-200 shadow-sm" />
          )}
          <div className="flex-1">
            <div className="text-lg font-semibold text-purple-800 mb-1">
              {name || ticker}
              {ticker && name && <span className="ml-2 text-purple-600 font-normal text-sm">({ticker})</span>}
            </div>
            {description && (
              <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sector && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Secteur</div>
              </div>
              <div className="text-sm text-purple-800 font-medium">{sector}</div>
            </div>
          )}
          {industry && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Factory className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Industrie</div>
              </div>
              <div className="text-sm text-purple-800 font-medium">{industry}</div>
            </div>
          )}
          {exchange && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Bourse</div>
              </div>
              <div className="text-sm text-purple-800 font-medium">{exchange}</div>
            </div>
          )}
          {country && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Pays</div>
              </div>
              <div className="text-sm text-purple-800 font-medium">{country}</div>
            </div>
          )}
          {currency && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Devise</div>
              </div>
              <div className="text-sm text-purple-800 font-medium">{currency}</div>
            </div>
          )}
          {website && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="w-3 h-3 text-purple-600" />
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Site web</div>
              </div>
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-700 hover:text-purple-900 underline font-medium">
                Site officiel
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CompanyProfile);

