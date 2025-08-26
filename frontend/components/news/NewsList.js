"use client";

import { memo, useMemo } from "react";

function NewsList({ newsJson }) {
  const articles = useMemo(() => {
    try {
      const obj = typeof newsJson === 'string' ? JSON.parse(newsJson) : newsJson;
      // Support either array or object with articles
      if (Array.isArray(obj)) return obj;
      if (obj && Array.isArray(obj.articles)) return obj.articles;
      return [];
    } catch (e) {
      console.error("Failed to parse news JSON:", e);
      return [];
    }
  }, [newsJson]);

  if (!articles.length) {
    return (
      <div className="text-xs text-gray-600">Aucune actualité disponible.</div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-3 text-sm font-semibold bg-gradient-to-r from-purple-400 to-purple-600 text-white border-b">Actualités</div>
      <ul className="divide-y divide-gray-200">
        {articles.map((a, i) => (
          <li key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                >
                  {a.title || a.headline || 'Sans titre'}
                </a>
                {a.source && (
                  <div className="text-[11px] text-gray-500 mt-0.5">{a.source.name || a.source}</div>
                )}
                {a.publishedAt && (
                  <div className="text-[11px] text-gray-400">
                    {new Date(a.publishedAt).toLocaleString('fr-FR')}
                  </div>
                )}
                {a.description && (
                  <p className="text-xs text-gray-700 mt-2">{a.description}</p>
                )}
              </div>
              {a.urlToImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.urlToImage}
                  alt={a.title || 'news'}
                  className="w-20 h-20 object-cover rounded-md border"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(NewsList);

