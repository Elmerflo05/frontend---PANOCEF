import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  ShieldAlert,
  ShieldCheck,
  Shield
} from 'lucide-react';
import ApiAuthService from '@/services/api/authService';

interface ExpiredPasswordModalProps {
  isOpen: boolean;
  email: string;
  currentPassword?: string; // Opcional, si no se pasa se pide al usuario
  onSuccess: () => void;
  onCancel: () => void;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

const ExpiredPasswordModal = ({
  isOpen,
  email,
  currentPassword: initialCurrentPassword,
  onSuccess,
  onCancel
}: ExpiredPasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword || '');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calcular fortaleza de la contraseña
  const passwordStrength = useMemo((): PasswordStrength => {
    if (newPassword.length < 6) return 'weak';

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score++;

    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }, [newPassword]);

  const strengthConfig = {
    weak: {
      label: 'Baja',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      icon: ShieldAlert,
      width: 'w-1/3'
    },
    medium: {
      label: 'Media',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      icon: Shield,
      width: 'w-2/3'
    },
    strong: {
      label: 'Alta',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      icon: ShieldCheck,
      width: 'w-full'
    }
  };

  // Validaciones mínimas requeridas
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const minLengthMet = newPassword.length >= 6;
  const hasCurrentPassword = currentPassword.length > 0;
  const isPasswordValid = minLengthMet && passwordsMatch && hasCurrentPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasCurrentPassword) {
      setError('Ingresa tu contraseña actual');
      return;
    }

    if (!minLengthMet) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiAuthService.changeExpiredPassword(
        email,
        currentPassword,
        newPassword
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStrength = strengthConfig[passwordStrength];
  const StrengthIcon = currentStrength.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Contraseña Expirada</h2>
                    <p className="text-amber-100 text-sm">
                      Tu contraseña ha expirado y debe ser cambiada
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Contraseña Actualizada
                  </h3>
                  <p className="text-gray-500">
                    Tu contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Contraseña actual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Ingresa tu contraseña actual"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Ingresa tu nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Indicador de seguridad */}
                  {newPassword.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Seguridad de la contraseña:</span>
                        <span className={`font-medium flex items-center gap-1 ${currentStrength.color}`}>
                          <StrengthIcon className="w-4 h-4" />
                          {currentStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
                          className={`h-full ${currentStrength.bgColor} transition-all duration-300`}
                        />
                      </div>
                      {!minLengthMet && (
                        <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                      )}
                    </div>
                  )}

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="Confirma tu nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Las contraseñas coinciden
                      </p>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!isPasswordValid || isLoading}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        'Cambiar Contraseña'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpiredPasswordModal;
