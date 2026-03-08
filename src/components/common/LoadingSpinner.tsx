import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-clinic-primary',
  secondary: 'text-gray-500',
  white: 'text-white'
};

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className,
  text 
}: LoadingSpinnerProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        className={cn(
          'border-2 border-t-transparent border-current rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p
          className={cn('text-sm font-medium', colorClasses[color])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Full screen loading component
export const FullScreenLoading = ({ text = 'Cargando...' }: { text?: string }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <LoadingSpinner size="xl" text={text} />
  </div>
);

// Page loading component
export const PageLoading = ({ text }: { text?: string }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);