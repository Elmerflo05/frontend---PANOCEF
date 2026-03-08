/**
 * Componente de radio button reutilizable
 * Usado para opciones mutuamente excluyentes
 */

interface RadioOptionProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  colorTheme?: 'cyan' | 'purple' | 'amber' | 'blue' | 'panocef';
}

const themeColors = {
  cyan: 'text-panocef-primary focus:ring-panocef-primary',
  purple: 'text-panocef-primary focus:ring-panocef-primary',
  amber: 'text-amber-600 focus:ring-amber-500',
  blue: 'text-panocef-accent focus:ring-panocef-accent',
  panocef: 'text-panocef-primary focus:ring-panocef-primary'
};

export const RadioOption = ({
  label,
  name,
  value,
  checked,
  onChange,
  disabled = false,
  colorTheme = 'purple'
}: RadioOptionProps) => {
  return (
    <label className={`flex items-center gap-2 ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className={`${themeColors[colorTheme]} disabled:opacity-50`}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};
