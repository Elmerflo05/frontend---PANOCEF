/**
 * Componente de encabezado de sección reutilizable
 */

import { Save, LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  showSaveButton?: boolean;
  onSave?: () => void;
  loading?: boolean;
  colorTheme?: 'cyan' | 'purple' | 'teal' | 'blue' | 'panocef';
}

const themeColors = {
  cyan: {
    bg: 'bg-panocef-primary',
    text: 'text-white',
    subtitle: 'text-panocef-light',
    button: 'bg-white text-panocef-primary hover:bg-panocef-light'
  },
  purple: {
    bg: 'bg-panocef-primary',
    text: 'text-white',
    subtitle: 'text-panocef-light',
    button: 'bg-white text-panocef-primary hover:bg-panocef-light'
  },
  teal: {
    bg: 'bg-panocef-accent',
    text: 'text-white',
    subtitle: 'text-panocef-light',
    button: 'bg-white text-panocef-accent hover:bg-panocef-light'
  },
  blue: {
    bg: 'bg-panocef-accent',
    text: 'text-white',
    subtitle: 'text-panocef-light',
    button: 'bg-white text-panocef-accent hover:bg-panocef-light'
  },
  panocef: {
    bg: 'bg-panocef-primary',
    text: 'text-white',
    subtitle: 'text-panocef-light',
    button: 'bg-white text-panocef-primary hover:bg-panocef-light'
  }
};

export const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  showSaveButton = false,
  onSave,
  loading = false,
  colorTheme = 'purple'
}: SectionHeaderProps) => {
  const colors = themeColors[colorTheme];

  return (
    <div className={`${colors.bg} p-5 ${colors.text} flex items-center justify-between rounded-t-xl`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6" />}
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className={`text-sm ${colors.subtitle}`}>{subtitle}</p>}
        </div>
      </div>
      {showSaveButton && onSave && (
        <button
          onClick={onSave}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 ${colors.button} rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      )}
    </div>
  );
};
