import { useAuth } from './useAuth';

export const useLogo = () => {
  const { user } = useAuth();

  // Definir el logo basado en el rol del usuario
  const getLogo = () => {
    if (!user) {
      return '/logo.png'; // Logo por defecto
    }

    // Roles que usan el logo de PanoCef 3D
    if (user.role === 'imaging_technician' || user.role === 'external_client') {
      return '/GENESIS-PANOCEF-final-01.png';
    }

    // Todos los demás roles usan el logo por defecto
    return '/logo.png';
  };

  const getLogoAlt = () => {
    if (!user) {
      return 'Logo';
    }

    if (user.role === 'imaging_technician' || user.role === 'external_client') {
      return 'PanoCef 3D';
    }

    return 'Centro Odontológico';
  };

  const getAppName = () => {
    if (!user) {
      return 'Centro Odontológico';
    }

    if (user.role === 'imaging_technician') {
      return 'PanoCef 3D';
    }

    if (user.role === 'external_client') {
      return 'PanoCef 3D';
    }

    return 'Centro Odontológico';
  };

  return {
    logo: getLogo(),
    logoAlt: getLogoAlt(),
    appName: getAppName(),
  };
};
