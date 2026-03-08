/**
 * Modal de advertencia de cierre de sesión por inactividad
 * Se muestra 60 segundos antes del cierre automático
 */
import { useEffect } from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface SessionTimeoutWarningProps {
  /** Si el modal debe mostrarse */
  show: boolean;
  /** Tiempo restante en segundos */
  timeRemaining: number;
  /** Callback para extender la sesión */
  onExtend: () => void;
}

export const SessionTimeoutWarning = ({
  show,
  timeRemaining,
  onExtend
}: SessionTimeoutWarningProps) => {
  // Formatear tiempo como MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sonido de advertencia cuando queden 10 segundos
  useEffect(() => {
    if (show && timeRemaining === 10) {
      // Intentar reproducir un beep (si el navegador lo permite)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      } catch {
        // Ignorar si no se puede reproducir audio
      }
    }
  }, [show, timeRemaining]);

  // Si no se muestra, no renderizar nada (desmontaje inmediato)
  if (!show) return null;

  return (
    <>
      {/* Overlay - clic para extender sesión */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fadeIn"
        onClick={onExtend}
      />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto animate-scaleIn">
          {/* Header con warning */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Sesión por expirar</h2>
                <p className="text-sm text-white/80">Tu sesión se cerrará por inactividad</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-8 text-center">
            {/* Timer circular */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Círculo de fondo */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Círculo de progreso */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={timeRemaining <= 10 ? '#ef4444' : '#f59e0b'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - timeRemaining / 60)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Tiempo en el centro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock className={`w-6 h-6 mb-1 ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                <span className={`text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              {timeRemaining <= 10
                ? '¡Tu sesión se cerrará en segundos!'
                : 'Haz clic en el botón para continuar trabajando'
              }
            </p>

            {/* Botón de extender */}
            <button
              onClick={onExtend}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <RefreshCw className="w-5 h-5" />
              Continuar trabajando
            </button>

            <p className="text-xs text-gray-400 mt-4">
              La sesión se extenderá automáticamente al detectar actividad
            </p>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default SessionTimeoutWarning;
