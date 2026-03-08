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
  colorTheme?: 'cyan' | 'purple' | 'amber' | 'blue';
}

const themeColors = {
  cyan: 'text-cyan-600 focus:ring-cyan-500',
  purple: 'text-purple-600 focus:ring-purple-500',
  amber: 'text-amber-600 focus:ring-amber-500',
  blue: 'text-blue-600 focus:ring-blue-500'
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
