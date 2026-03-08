/**
 * Componente de título de subsección reutilizable
 */

interface SubsectionTitleProps {
  title: string;
  colorTheme?: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'indigo' | 'cyan' | 'teal' | 'pink' | 'red' | 'gray';
}

const themeColors = {
  blue: 'bg-blue-100 text-blue-900',
  green: 'bg-green-100 text-green-900',
  yellow: 'bg-yellow-100 text-yellow-900',
  orange: 'bg-orange-100 text-orange-900',
  purple: 'bg-purple-100 text-purple-900',
  indigo: 'bg-indigo-100 text-indigo-900',
  cyan: 'bg-cyan-100 text-cyan-900',
  teal: 'bg-teal-100 text-teal-900',
  pink: 'bg-pink-100 text-pink-900',
  red: 'bg-red-100 text-red-900',
  gray: 'bg-gray-100 text-gray-900'
};

export const SubsectionTitle = ({
  title,
  colorTheme = 'blue'
}: SubsectionTitleProps) => {
  return (
    <h4 className={`px-3 py-1 mb-3 text-sm font-semibold ${themeColors[colorTheme]} rounded`}>
      {title}
    </h4>
  );
};
