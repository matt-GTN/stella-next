"use client";

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  help,
  className = "",
  disabled = false,
  formatValue
}) {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
        <label className="text-xs sm:text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm text-purple-700 font-mono bg-purple-100 px-2 sm:px-3 py-1 rounded-lg font-semibold self-start sm:self-auto">
          {displayValue}
        </span>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
        aria-label={label}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {help && (
        <p className="text-xs text-gray-500 italic leading-relaxed">
          {help}
        </p>
      )}
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(168, 85, 247, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(168, 85, 247, 0.4);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 8px 16px rgba(168, 85, 247, 0.5);
        }
        
        .slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(168, 85, 247, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(168, 85, 247, 0.4);
        }
        
        .slider::-moz-range-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 8px 16px rgba(168, 85, 247, 0.5);
        }
        
        @media (max-width: 640px) {
          .slider::-webkit-slider-thumb {
            width: 32px;
            height: 32px;
          }
          
          .slider::-moz-range-thumb {
            width: 32px;
            height: 32px;
          }
        }
        
        .slider {
          background: linear-gradient(to right, #e5e7eb, #a855f7);
          transition: all 0.2s ease;
        }
        
        .slider:hover {
          background: linear-gradient(to right, #d1d5db, #a855f7);
        }
        
        .slider:disabled::-webkit-slider-thumb {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .slider:disabled::-moz-range-thumb {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .slider:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
