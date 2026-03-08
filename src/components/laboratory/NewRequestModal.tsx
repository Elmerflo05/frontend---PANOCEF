/**
 * MODAL DE NUEVA SOLICITUD - TOMOGRAFÍAS 3D + RADIOGRAFÍAS
 * Formulario en dos pasos:
 * - Paso 1: Tomografías 3D (PanoCef 3D)
 * - Paso 2: Radiografías (PanoCef Radiografías)
 *
 * ARQUITECTURA:
 * - useUnifiedRadiographyForm hook (estado separado por sección)
 * - Componentes unificados de @/components/laboratory-form
 * - Tipos unificados (PatientData, DoctorData, Tomografia3DFormData, RadiografiasFormData)
 * - Servicios de validación y helpers
 *
 * ALMACENAMIENTO:
 * - Los datos se guardan en PostgreSQL via radiographyApi (NO IndexedDB)
 * - Tabla: radiography_requests
 * - Campos JSONB: request_data (formulario completo) y pricing_data (precios)
 *
 * @version 2.0.0 - Integración completa con Backend PostgreSQL
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileImage, ArrowRight, ArrowLeft, MessageCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
// API del backend para radiografías (NO IndexedDB)
import { radiographyApi, type RadiographyRequestData } from '@/services/api/radiographyApi';

// NUEVO: Hook y componentes UNIFICADOS
import { useUnifiedRadiographyForm } from '@/hooks/useUnifiedRadiographyForm';
import {
  TomografiaFormStepUnified,
  RadiografiasFormStepUnified,
  type Tomografia3DPricing,
  type RadiografiasPricing
} from '@/components/laboratory-form';

import { validateRadiografiasStep2 } from '@/services/radiography';
// SERVICIO UNIFICADO DE CÁLCULO DE PRECIOS (usa configuración del admin desde API)
import { calculateLaboratoryPrice, formatPrice, type PriceBreakdownItem } from '@/services/laboratory';
import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date; // Fecha inicial pre-cargada desde el calendario
}

export const NewRequestModal = ({ isOpen, onClose, onSuccess, initialDate }: NewRequestModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date>(initialDate || new Date());
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [missingPrices, setMissingPrices] = useState<string[]>([]);
  const [tomografiaSubtotal, setTomografiaSubtotal] = useState<number>(0);
  const { user } = useAuthStore();
  const { settings } = useAppSettingsStore();

  // NUEVO: Hook UNIFICADO con datos separados
  const form = useUnifiedRadiographyForm();

  // HOOKS DE PRECIOS CONFIGURADOS POR EL SUPER ADMIN
  const { pricing: tomografiaPricing } = useTomografia3DPricing();
  const { pricing: radiografiasPricing } = useRadiografiasPricing();

  // PanoCef branding - unified theme

  // Actualizar fecha cuando cambie initialDate
  useState(() => {
    if (initialDate) {
      setAppointmentDate(initialDate);
    }
  });

  // ========================================
  // CALCULAR SUBTOTAL DE TOMOGRAFÍA EN TIEMPO REAL (Paso 1)
  // ========================================
  useEffect(() => {
    const tomografiaFormData = {
      conInforme: form.tomografiaData.conInforme,
      sinInforme: form.tomografiaData.sinInforme,
      dicom: form.tomografiaData.dicom,
      soloUsb: form.tomografiaData.soloUsb,
      endodoncia: form.tomografiaData.endodoncia,
      fracturaRadicular: form.tomografiaData.fracturaRadicular,
      anatomiaEndodontica: form.tomografiaData.anatomiaEndodontica,
      localizacionDiente: form.tomografiaData.localizacionDiente,
      implantes: form.tomografiaData.implantes,
      maxilarSuperior: form.tomografiaData.maxilarSuperior,
      viaAerea: form.tomografiaData.viaAerea,
      ortognatica: form.tomografiaData.ortognatica,
      marpe: form.tomografiaData.marpe,
      miniImplantes: form.tomografiaData.miniImplantes,
      atm: form.tomografiaData.atm,
      macizoFacial: form.tomografiaData.macizoFacial
    };

    // Calcular solo tomografía para mostrar subtotal en Paso 1
    const emptyRadiografias = {};
    const emptyRadiografiasPricing = {
      periapicalFisico: 0, periapicalDigital: 0, bitewingAmbos: 0,
      bitewingDerecho: 0, bitewingIzquierdo: 0, oclusalSuperiores: 0,
      oclusalInferiores: 0, seriada: 0, radiografias: 0,
      halografiaPanoramica: 0, halografiaLateral: 0, halografiaPosterior: 0,
      estudiosAtm: 0, radiografiaCefalometrica: 0,
      paq1ConAsesoria: 0, paq1SinAsesoria: 0,
      paq2ConAsesoria: 0, paq2SinAsesoria: 0,
      paq3ConAsesoria: 0, paq3SinAsesoria: 0,
      alteracionesInmediatas: 0, escaneoImpresionDigital: 0, modelosEstudio3d: 0,
      ricketts: 0, powell: 0, nordEstelametal: 0, steinerBianco: 0,
      steiner: 0, bjork: 0, mcNamara: 0, usp: 0, especificarOtros: 0
    };

    try {
      const tomoResult = calculateLaboratoryPrice(
        tomografiaFormData,
        emptyRadiografias as any,
        tomografiaPricing,
        emptyRadiografiasPricing as any
      );
      setTomografiaSubtotal(tomoResult.totalPrice);
    } catch {
      setTomografiaSubtotal(0);
    }
  }, [form.tomografiaData, tomografiaPricing]);

  // ========================================
  // CALCULAR PRECIO TOTAL EN TIEMPO REAL (Paso 2)
  // Usa los 88 precios configurados por el Super Admin
  // ========================================
  useEffect(() => {
    // Solo calcular breakdown completo en paso 2 (Radiografías)
    if (form.currentStep !== 2) {
      setPriceBreakdown([]);
      setTotalPrice(0);
      setMissingPrices([]);
      return;
    }

    try {
      // Usar datos de tomografía directamente (ya están en formato correcto)
      const tomografiaFormData = {
        conInforme: form.tomografiaData.conInforme,
        sinInforme: form.tomografiaData.sinInforme,
        dicom: form.tomografiaData.dicom,
        soloUsb: form.tomografiaData.soloUsb,
        endodoncia: form.tomografiaData.endodoncia,
        fracturaRadicular: form.tomografiaData.fracturaRadicular,
        anatomiaEndodontica: form.tomografiaData.anatomiaEndodontica,
        localizacionDiente: form.tomografiaData.localizacionDiente,
        implantes: form.tomografiaData.implantes,
        maxilarSuperior: form.tomografiaData.maxilarSuperior,
        viaAerea: form.tomografiaData.viaAerea,
        ortognatica: form.tomografiaData.ortognatica,
        marpe: form.tomografiaData.marpe,
        miniImplantes: form.tomografiaData.miniImplantes,
        atm: form.tomografiaData.atm,
        macizoFacial: form.tomografiaData.macizoFacial
      };

      const radiografiasFormData = {
        // Periapical
        periapicalFisico: form.radiografiasData.intraoralTipo.includes('fisico'),
        periapicalDigital: form.radiografiasData.intraoralTipo.includes('digital'),
        dientesSuperiores: form.radiografiasData.dientesSuperioresFisico,
        dientesInferiores: form.radiografiasData.dientesInferioresFisico,

        // Bitewing
        bitewingAmbos: form.radiografiasData.bitewingMolaresDerecha && form.radiografiasData.bitewingMolaresIzquierda,
        bitewingDerecho: form.radiografiasData.bitewingMolaresDerecha || form.radiografiasData.bitewingPremolaresDerecha,
        bitewingIzquierdo: form.radiografiasData.bitewingMolaresIzquierda || form.radiografiasData.bitewingPremolaresIzquierda,

        // Oclusal
        oclusalSuperiores: form.radiografiasData.oclusalSuperiores,
        oclusalInferiores: form.radiografiasData.oclusalInferiores,

        // Otras
        seriada: form.radiografiasData.seriada,
        radiografias: form.radiografiasData.fotografiaIntraoral,

        // Extraorales
        halografiaPanoramica: form.radiografiasData.extraoralPanoramica,
        halografiaLateral: form.radiografiasData.extraoralCefalometrica,
        halografiaPosterior: form.radiografiasData.extraoralPosteriorAnterior,
        estudiosAtm: form.radiografiasData.extraoralAtmAbierta || form.radiografiasData.extraoralAtmCerrada,
        radiografiaCefalometrica: form.radiografiasData.extraoralCefalometrica,

        // Paquetes Ortodoncia
        paq1ConAsesoria: form.radiografiasData.ortodonciaPaquete === 1 && form.radiografiasData.ortodonciaPlanTratamiento === 'con',
        paq1SinAsesoria: form.radiografiasData.ortodonciaPaquete === 1 && form.radiografiasData.ortodonciaPlanTratamiento !== 'con',
        paq2ConAsesoria: form.radiografiasData.ortodonciaPaquete === 2 && form.radiografiasData.ortodonciaPlanTratamiento === 'con',
        paq2SinAsesoria: form.radiografiasData.ortodonciaPaquete === 2 && form.radiografiasData.ortodonciaPlanTratamiento !== 'con',
        paq3ConAsesoria: form.radiografiasData.ortodonciaPaquete === 3 && form.radiografiasData.ortodonciaPlanTratamiento === 'con',
        paq3SinAsesoria: form.radiografiasData.ortodonciaPaquete === 3 && form.radiografiasData.ortodonciaPlanTratamiento !== 'con',

        // Servicios Adicionales
        alteracionesInmediatas: form.radiografiasData.ortodonciaAlineadores,
        escaneoImpresionDigital: form.radiografiasData.ortodonciaImpresion,
        modelosEstudio3d: form.radiografiasData.modelosDigitalesConInforme
      };

      // Calcular precio usando el nuevo servicio
      const result = calculateLaboratoryPrice(
        tomografiaFormData,
        radiografiasFormData,
        tomografiaPricing,
        radiografiasPricing
      );

      setPriceBreakdown(result.breakdown);
      setTotalPrice(result.totalPrice);
      setMissingPrices(result.missingPrices);

      // Mostrar advertencia si hay precios faltantes
      if (result.missingPrices.length > 0 && result.missingPrices.length <= 5) {
        toast.warning(`Algunos precios no están configurados: ${result.missingPrices.join(', ')}`);
      } else if (result.missingPrices.length > 5) {
        toast.warning(`${result.missingPrices.length} precios no están configurados por el administrador`);
      }

    } catch (error) {
      console.error('Error calculando precio:', error);
      setPriceBreakdown([]);
      setTotalPrice(0);
      setMissingPrices([]);
    }
  }, [
    form.currentStep,
    form.tomografiaData,
    form.radiografiasData,
    tomografiaPricing,
    radiografiasPricing
  ]);

  const handleSubmit = async (e: React.FormEvent, requestDiscount: boolean = false) => {
    e.preventDefault();

    if (form.currentStep === 1) {
      // NUEVO: Validar usando patientData separado
      if (!form.patientData.nombres.trim()) {
        toast.error('Los nombres del paciente son obligatorios');
        return;
      }
      if (!form.patientData.apellidos.trim()) {
        toast.error('Los apellidos del paciente son obligatorios');
        return;
      }
      if (!form.patientData.dni.trim()) {
        toast.error('El DNI del paciente es obligatorio');
        return;
      }

      form.handlers.nextStep();
      return;
    }

    // Validar paso 2
    const validation = validateRadiografiasStep2(form.radiografiasData);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);

      // Formatear el breakdown de precios para la API
      const formattedBreakdown = priceBreakdown.map(item => ({
        category: item.category as 'intraoral' | 'extraoral' | 'ortodoncias' | 'analisis' | 'tomografia3D',
        subcategory: item.subcategory,
        itemName: item.itemName,
        itemKey: item.itemKey,
        basePrice: item.basePrice,
        quantity: item.quantity,
        subtotal: item.subtotal
      }));

      // Construir datos para la API del backend (PostgreSQL)
      const apiRequestData: RadiographyRequestData = {
        // Campos básicos requeridos por la tabla
        request_date: formatDateToYMD(appointmentDate),
        radiography_type: 'panocef', // Tipo especial para solicitudes PanoCef
        request_status: 'pending',
        urgency: 'normal',

        // Datos complejos del formulario PanoCef en request_data
        request_data: {
          patient: {
            dni: form.patientData.dni,
            nombres: form.patientData.nombres,
            apellidos: form.patientData.apellidos,
            telefono: form.patientData.telefono || undefined,
            fechaNacimiento: form.patientData.fechaNacimiento || undefined,
            edad: form.patientData.edad || undefined
          },
          doctor: {
            nombre: `${form.doctorData.nombres} ${form.doctorData.apellidos}`.trim(),
            especialidad: undefined,
            colegiatura: form.doctorData.cop || undefined,
            telefono: form.doctorData.telefono || undefined
          },
          tomografia3D: {
            conInforme: form.tomografiaData.conInforme,
            sinInforme: form.tomografiaData.sinInforme,
            dicom: form.tomografiaData.dicom,
            soloUsb: form.tomografiaData.soloUsb,
            endodoncia: form.tomografiaData.endodoncia,
            fracturaRadicular: form.tomografiaData.fracturaRadicular,
            anatomiaEndodontica: form.tomografiaData.anatomiaEndodontica,
            localizacionDiente: form.tomografiaData.localizacionDiente,
            implantes: form.tomografiaData.implantes,
            maxilarSuperior: form.tomografiaData.maxilarSuperior,
            viaAerea: form.tomografiaData.viaAerea,
            ortognatica: form.tomografiaData.ortognatica,
            marpe: form.tomografiaData.marpe,
            miniImplantes: form.tomografiaData.miniImplantes,
            atm: form.tomografiaData.atm,
            macizoFacial: form.tomografiaData.macizoFacial,
            zonaInteres: form.tomografiaData.zonaInteres || undefined,
            indicacionClinica: form.tomografiaData.indicacionClinica || undefined
          },
          radiografias: {
            periapical: form.radiografiasData.dientesSuperioresFisico.length > 0 ||
                        form.radiografiasData.dientesInferioresFisico.length > 0 ||
                        form.radiografiasData.dientesTemporalesFisico.length > 0,
            periapicalTipo: form.radiografiasData.intraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            periapicalCantidad: form.radiografiasData.dientesSuperioresFisico.length +
                               form.radiografiasData.dientesInferioresFisico.length +
                               form.radiografiasData.dientesTemporalesFisico.length,
            bitewingAmbos: form.radiografiasData.bitewingMolaresDerecha && form.radiografiasData.bitewingMolaresIzquierda,
            bitewingDerecho: form.radiografiasData.bitewingMolaresDerecha || form.radiografiasData.bitewingPremolaresDerecha,
            bitewingIzquierdo: form.radiografiasData.bitewingMolaresIzquierda || form.radiografiasData.bitewingPremolaresIzquierda,
            bitewingTipo: form.radiografiasData.intraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            oclusalSuperiores: form.radiografiasData.oclusalSuperiores,
            oclusalSuperioresTipo: form.radiografiasData.intraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            oclusalInferiores: form.radiografiasData.oclusalInferiores,
            oclusalInferioresTipo: form.radiografiasData.intraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            seriada: form.radiografiasData.seriada,
            seriadaTipo: form.radiografiasData.intraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            panoramica: form.radiografiasData.extraoralPanoramica,
            panoramicaTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            cefalometricaLateral: form.radiografiasData.extraoralCefalometrica,
            cefalometricaLateralTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            carpal: form.radiografiasData.extraoralCarpal,
            carpalTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            carpalFishman: form.radiografiasData.carpalFishman,
            carpalTtw2: form.radiografiasData.carpalTtw2,
            posteriorAnterior: form.radiografiasData.extraoralPosteriorAnterior,
            posteriorAnteriorTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            posteriorAnteriorRicketts: form.radiografiasData.posteriorAnteriorRicketts,
            atmBocaAbierta: form.radiografiasData.extraoralAtmAbierta,
            atmBocaAbiertaTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            atmBocaCerrada: form.radiografiasData.extraoralAtmCerrada,
            atmBocaCerradaTipo: form.radiografiasData.extraoralTipo?.includes('fisico') ? 'fisico' : 'digital',
            fotografiaIntraoral: form.radiografiasData.fotografiaIntraoral,
            fotografiaExtraoral: form.radiografiasData.extraoralFotografia,
            ortodonciaTipo: form.radiografiasData.ortodonciaTipo?.includes('paquete') ? 'paquete' : 'individual',
            ortodonciaPaquete: form.radiografiasData.ortodonciaPaquete,
            ortodonciaAlineadores: form.radiografiasData.ortodonciaAlineadores,
            ortodonciaEscaneo: form.radiografiasData.ortodonciaEscaneo,
            ortodonciaImpresion: form.radiografiasData.ortodonciaImpresion,
            ortodonciaPlanTratamiento: form.radiografiasData.ortodonciaPlanTratamiento as 'sin' | 'con',
            analisisCefalometrico: form.radiografiasData.analisisSteiner || form.radiografiasData.analisisRicketts ||
                                  form.radiografiasData.analisisMcNamara || form.radiografiasData.analisisJarabak ||
                                  form.radiografiasData.analisisBjork || form.radiografiasData.analisisUspTweed,
            analisisSteiner: form.radiografiasData.analisisSteiner,
            analisisRicketts: form.radiografiasData.analisisRicketts,
            analisisMcNamara: form.radiografiasData.analisisMcNamara,
            analisisJarabak: form.radiografiasData.analisisJarabak,
            analisisBjork: form.radiografiasData.analisisBjork,
            analisisUspTweed: form.radiografiasData.analisisUspTweed
          }
        },

        // Datos de pricing
        pricing_data: {
          breakdown: formattedBreakdown,
          suggestedPrice: totalPrice,
          finalPrice: totalPrice,
          status: 'pending'
        },

        // Notas adicionales
        notes: requestDiscount ? 'SOLICITA DESCUENTO' : undefined
      };

      // Enviar al backend via API
      const response = await radiographyApi.createRadiographyRequest(apiRequestData);

      toast.success('Solicitud creada exitosamente');

      // Si solicitó descuento, abrir WhatsApp
      if (requestDiscount) {
        const patientName = `${form.patientData.nombres} ${form.patientData.apellidos}`;
        const requestId = response.data.radiography_request_id || response.data.request_id || 'N/A';
        openWhatsAppForPromotion(String(requestId), patientName);
      }

      form.handlers.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al crear solicitud de radiografía:', error);

      // Manejo de errores específicos
      if (error?.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else if (error?.response?.status === 403) {
        toast.error('No tiene permisos para crear solicitudes.');
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.error || 'Datos de solicitud inválidos';
        toast.error(`Error de validación: ${errorMessage}`);
      } else if (error?.response?.status >= 500) {
        toast.error('Error del servidor. Por favor, intente más tarde.');
      } else if (error?.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Error al crear la solicitud. Verifique su conexión e intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.handlers.reset();
    onClose();
  };

  // Función para abrir WhatsApp con mensaje predefinido (dudas generales)
  const handleWhatsAppClick = () => {
    // Usar configuración del store o fallback a valores por defecto
    const phone = settings?.whatsappNumber || '51999999999';
    const message = encodeURIComponent('Hola, tengo dudas sobre mi solicitud de estudios radiológicos.');
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Abriendo WhatsApp...');
  };

  // Función para abrir WhatsApp solicitando promociones
  const openWhatsAppForPromotion = (requestId: string, patientName: string) => {
    // Usar WhatsApp específico del Centro de Imágenes (PanoCef) si está configurado
    const phone = settings?.whatsappImaging || settings?.whatsappNumber || '51999999999';
    const message = encodeURIComponent(
      `Hola PanoCef 👋\n\n` +
      `Acabo de enviar la solicitud #${requestId} para estudios radiológicos del paciente ${patientName}.\n\n` +
      `¿Tienen alguna promoción o descuento disponible para estos servicios?\n\n` +
      `Gracias!`
    );
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Redirigiendo a WhatsApp para consultar promociones...');
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
        {/* Overlay oscuro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleCancel}
        />

        {/* Contenido del modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col relative z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-panocef-primary to-panocef-accent px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileImage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {form.currentStep === 1 ? 'Paso 1: Tomografía 3D' : 'Paso 2: Radiografías'}
                </h2>
                <p className="text-sm text-panocef-light">PanoCef - Centro de Imágenes Dentomaxilofacial</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-white text-sm font-medium">
                Paso {form.currentStep} de 2
              </div>
              <button
                onClick={handleCancel}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-panocef-primary to-panocef-accent transition-all duration-300"
              style={{ width: `${(form.currentStep / 2) * 100}%` }}
            />
          </div>

          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            {form.currentStep === 1 ? (
              // PASO 1: TOMOGRAFÍA 3D - Usa componente UNIFICADO
              <div className="p-6">
                <TomografiaFormStepUnified
                  patientData={form.patientData}
                  doctorData={form.doctorData}
                  tomografiaData={form.tomografiaData}
                  onPatientChange={form.handlers.handlePatientChange}
                  onDoctorChange={form.handlers.handleDoctorChange}
                  onTomografiaChange={form.handlers.handleTomografiaChange}
                  pricing={tomografiaPricing}
                  showPrices={false}
                  showSelectors={user?.role !== 'external_client'}
                  colorTheme="cyan"
                />

                {/* Preview del subtotal de Tomografía */}
                {tomografiaSubtotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg border-2 bg-panocef-light border-panocef-secondary"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-5 h-5 ${'text-panocef-primary'}`} />
                        <span className="font-medium text-gray-700">Subtotal Tomografía 3D:</span>
                      </div>
                      <span className={`text-xl font-bold ${'text-panocef-primary'}`}>
                        {formatPrice(tomografiaSubtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Este es un estimado. El precio final se calculará en el siguiente paso con todos los servicios.
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              // PASO 2: RADIOGRAFÍAS - Usa componente UNIFICADO
              <div className="p-6">
                <RadiografiasFormStepUnified
                  formData={form.radiografiasData}
                  onFormChange={form.handlers.handleRadiografiasChange}
                  pricing={radiografiasPricing}
                  showPrices={true}
                  priceBreakdown={priceBreakdown}
                  totalPrice={totalPrice}
                  colorTheme="cyan"
                />
              </div>
            )}

            {/* Footer - Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              {/* Left Side - Back Button or WhatsApp */}
              <div className="flex items-center gap-3">
                {form.currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={form.handlers.previousStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 shadow-sm"
                    title="¿Tienes dudas? Contáctanos por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Dudas y Solicitudes
                  </button>
                )}
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>

                {form.currentStep === 1 ? (
                  <button
                    type="submit"
                    className={`px-6 py-2 bg-gradient-to-r text-white rounded-lg transition-colors font-medium flex items-center gap-2 ${
                      'from-panocef-primary to-panocef-accent hover:from-panocef-dark hover:to-panocef-primary'
                    }`}
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    {/* Botón: Preguntar por Promociones */}
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isSubmitting ? 'Enviando...' : 'Preguntar por Promociones'}
                    </button>

                    {/* Botón: Enviar Solicitud Normal */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-panocef-primary to-panocef-accent hover:from-panocef-dark hover:to-panocef-primary text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Guardando...' : 'Enviar Solicitud'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
