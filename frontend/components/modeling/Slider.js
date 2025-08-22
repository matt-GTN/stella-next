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
  disabled = false
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
          {value}
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
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {help && (
        <p className="text-xs text-gray-500 italic">
          {help}
        </p>
      )}
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider:disabled::-webkit-slider-thumb {
          background: #d1d5db;
          cursor: not-allowed;
        }
        
        .slider:disabled::-moz-range-thumb {
          background: #d1d5db;
          cursor: not-allowed;
        }
        
        .slider:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
