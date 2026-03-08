/**
 * Componente de checkbox reutilizable
 * Usado en mode: 'edit' y 'view' para selección de estudios
 * En modo view (disabled), los items seleccionados se destacan visualmente
 */

import { DollarSign, Check } from 'lucide-react';

interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showPrice?: boolean;
  price?: number;
  colorTheme?: 'cyan' | 'purple' | 'pink' | 'blue' | 'green' | 'yellow' | 'orange' | 'teal' | 'indigo';
  children?: React.ReactNode;
}

const themeColors = {
  cyan: {
    checkbox: 'text-cyan-600 focus:ring-cyan-500',
    border: 'border-cyan-200',
    borderChecked: 'border-cyan-400',
    hover: 'hover:bg-cyan-50',
    bgChecked: 'bg-cyan-50',
    textChecked: 'text-cyan-800',
    iconBg: 'bg-cyan-500'
  },
  purple: {
    checkbox: 'text-purple-600 focus:ring-purple-500',
    border: 'border-purple-200',
    borderChecked: 'border-purple-400',
    hover: 'hover:bg-purple-50',
    bgChecked: 'bg-purple-50',
    textChecked: 'text-purple-800',
    iconBg: 'bg-purple-500'
  },
  pink: {
    checkbox: 'text-pink-600 focus:ring-pink-500',
    border: 'border-pink-200',
    borderChecked: 'border-pink-400',
    hover: 'hover:bg-pink-50',
    bgChecked: 'bg-pink-50',
    textChecked: 'text-pink-800',
    iconBg: 'bg-pink-500'
  },
  blue: {
    checkbox: 'text-blue-600 focus:ring-blue-500',
    border: 'border-blue-200',
    borderChecked: 'border-blue-400',
    hover: 'hover:bg-blue-50',
    bgChecked: 'bg-blue-50',
    textChecked: 'text-blue-800',
    iconBg: 'bg-blue-500'
  },
  green: {
    checkbox: 'text-green-600 focus:ring-green-500',
    border: 'border-green-200',
    borderChecked: 'border-green-400',
    hover: 'hover:bg-green-50',
    bgChecked: 'bg-green-50',
    textChecked: 'text-green-800',
    iconBg: 'bg-green-500'
  },
  yellow: {
    checkbox: 'text-yellow-600 focus:ring-yellow-500',
    border: 'border-yellow-200',
    borderChecked: 'border-yellow-400',
    hover: 'hover:bg-yellow-50',
    bgChecked: 'bg-yellow-50',
    textChecked: 'text-yellow-800',
    iconBg: 'bg-yellow-500'
  },
  orange: {
    checkbox: 'text-orange-600 focus:ring-orange-500',
    border: 'border-orange-200',
    borderChecked: 'border-orange-400',
    hover: 'hover:bg-orange-50',
    bgChecked: 'bg-orange-50',
    textChecked: 'text-orange-800',
    iconBg: 'bg-orange-500'
  },
  teal: {
    checkbox: 'text-teal-600 focus:ring-teal-500',
    border: 'border-teal-200',
    borderChecked: 'border-teal-400',
    hover: 'hover:bg-teal-50',
    bgChecked: 'bg-teal-50',
    textChecked: 'text-teal-800',
    iconBg: 'bg-teal-500'
  },
  indigo: {
    checkbox: 'text-indigo-600 focus:ring-indigo-500',
    border: 'border-indigo-200',
    borderChecked: 'border-indigo-400',
    hover: 'hover:bg-indigo-50',
    bgChecked: 'bg-indigo-50',
    textChecked: 'text-indigo-800',
    iconBg: 'bg-indigo-500'
  }
};

export const CheckboxItem = ({
  label,
  checked,
  onChange,
  disabled = false,
  showPrice = false,
  price,
  colorTheme = 'purple',
  children
}: CheckboxItemProps) => {
  const colors = themeColors[colorTheme];
  const isReadOnlyMode = disabled;

  // Estilos diferenciados para modo lectura
  const getContainerStyles = () => {
    if (isReadOnlyMode) {
      if (checked) {
        // Seleccionado en modo lectura: destacado con fondo y borde de color
        return `${colors.bgChecked} border-2 ${colors.borderChecked} shadow-sm`;
      } else {
        // No seleccionado en modo lectura: muy tenue, casi invisible
        return 'bg-gray-50/50 border border-gray-200 opacity-40';
      }
    }
    // Modo edicion normal
    return `bg-white border-2 ${colors.border} ${colors.hover}`;
  };

  const getLabelStyles = () => {
    if (isReadOnlyMode) {
      if (checked) {
        return `font-semibold ${colors.textChecked}`;
      } else {
        return 'font-normal text-gray-400';
      }
    }
    return 'font-medium text-gray-900';
  };

  return (
    <div className={`rounded-lg p-3 transition-all ${getContainerStyles()}`}>
      <label className={`flex items-center gap-2 ${!disabled ? 'cursor-pointer' : ''}`}>
        {isReadOnlyMode ? (
          // En modo lectura, mostrar icono de check en lugar de checkbox
          checked ? (
            <span className={`w-5 h-5 rounded ${colors.iconBg} flex items-center justify-center`}>
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
          ) : (
            <span className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-100" />
          )
        ) : (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className={`w-4 h-4 rounded border-gray-300 ${colors.checkbox}`}
          />
        )}
        <span className={`flex-1 ${getLabelStyles()}`}>
          {label}
        </span>
        {showPrice && price !== undefined && (
          <span className={`flex items-center gap-1 text-sm ${isReadOnlyMode && !checked ? 'text-gray-300' : 'text-gray-500'}`}>
            <DollarSign className="w-3 h-3" />
            {price.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </label>
      {children && checked && (
        <div className="mt-3 ml-6 pl-3 border-l-2 border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};
