"use client";

import { memo, useMemo } from "react";

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
      <div className="p-3 text-xs text-gray-500 border-b">Profil d'entreprise</div>
      <div className="p-4 flex gap-4 items-start">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={`${name || ticker} logo`} className="w-12 h-12 rounded-md border" />
        )}
        <div className="flex-1 space-y-2">
          <div className="text-sm font-semibold text-gray-900">
            {name || ticker}
            {ticker && name && <span className="ml-2 text-gray-500 font-normal">({ticker})</span>}
          </div>
          {description && (
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            {sector && <div><span className="text-gray-500">Secteur:</span> {sector}</div>}
            {industry && <div><span className="text-gray-500">Industrie:</span> {industry}</div>}
            {exchange && <div><span className="text-gray-500">Bourse:</span> {exchange}</div>}
            {country && <div><span className="text-gray-500">Pays:</span> {country}</div>}
            {currency && <div><span className="text-gray-500">Devise:</span> {currency}</div>}
          </div>
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-purple-600 hover:text-purple-800 underline">
              Site officiel
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CompanyProfile);

