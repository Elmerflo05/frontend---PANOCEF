import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Briefcase,
  Phone,
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import httpClient from '@/services/api/httpClient';

interface ExternalClientRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cop: string;
  specialty: string; // Texto libre ingresado manualmente
  password: string;
  confirmPassword: string;
}

interface ExternalClientRegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (email: string, password: string) => void;
}

const ExternalClientRegister = ({ onBackToLogin, onRegisterSuccess }: ExternalClientRegisterProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<ExternalClientRegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cop: '',
    specialty: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Formatear teléfono
    if (name === 'phone') {
      const onlyNumbers = value.replace(/\D/g, '').slice(0, 9);
      let formatted = onlyNumbers;
      if (onlyNumbers.length > 3 && onlyNumbers.length <= 6) {
        formatted = `${onlyNumbers.slice(0, 3)} ${onlyNumbers.slice(3)}`;
      } else if (onlyNumbers.length > 6) {
        formatted = `${onlyNumbers.slice(0, 3)} ${onlyNumbers.slice(3, 6)} ${onlyNumbers.slice(6)}`;
      }
      setFormData(prev => ({ ...prev, phone: formatted }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('Los nombres son obligatorios');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('El email no tiene un formato válido');
      return false;
    }

    if (!formData.cop.trim()) {
      toast.error('El COP es obligatorio');
      return false;
    }

    if (!formData.password.trim()) {
      toast.error('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Llamar a la API real de registro
      const response = await httpClient.post<{
        success: boolean;
        message: string;
        token: string;
        user: any;
        error?: string;
      }>('/auth/register-external-client', {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ''), // Quitar espacios del teléfono
        cop: formData.cop.trim(),
        specialty: formData.specialty.trim() || null, // Especialidad como texto
        password: formData.password
      });

      if (response.success) {
        toast.success('Registro exitoso. Ya puedes acceder al portal de laboratorio');
        // Auto-login después del registro exitoso
        onRegisterSuccess(formData.email.trim().toLowerCase(), formData.password);
      } else {
        toast.error(response.error || 'Error al registrar la cuenta');
      }

    } catch (error: any) {
      console.error('Error en registro:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al registrar la cuenta. Inténtalo nuevamente.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Odontólogo Externo</h1>
            <p className="text-gray-600 mt-2">
              Crea tu cuenta para acceder al portal de laboratorio
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-6">
            <div className="text-sm text-cyan-800">
              <p className="font-semibold mb-1">Información importante:</p>
              <p className="text-xs">
                Este registro te permitirá enviar solicitudes de estudios radiológicos y tomografías para tus pacientes.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombres *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Juan Carlos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Pérez González"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="ejemplo@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="999 999 999"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="w-4 h-4 inline mr-1" />
                COP (Colegio Odontológico del Perú) *
              </label>
              <input
                type="text"
                name="cop"
                value={formData.cop}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ej: 12345"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Número de colegiatura profesional</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Stethoscope className="w-4 h-4 inline mr-1" />
                Especialidad
              </label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ej: Ortodoncia, Endodoncia, Cirugía Oral..."
              />
              <p className="text-xs text-gray-500 mt-1">Ingresa tu especialidad (opcional)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Confirma tu contraseña"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className="text-cyan-600 hover:text-cyan-800 text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </button>
          </div>

          {/* Terms */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>
              Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExternalClientRegister;
