/**
 * Componente para entrada de precios
 * Usado en mode: 'pricing' por SuperAdmin
 */

import { DollarSign } from 'lucide-react';

interface PriceInputGroupProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  prefix?: string;
  disabled?: boolean;
}

export const PriceInputGroup = ({
  label,
  value,
  onChange,
  prefix,
  disabled = false
}: PriceInputGroupProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="text-sm text-gray-700 font-medium flex-1">{label}</span>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-xs text-gray-500">{prefix}</span>}
        <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            disabled={disabled}
            className="w-20 text-sm font-semibold text-gray-900 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};
