/**
 * Modal de Detalles de Solicitud - Versión Compacta
 *
 * Replica la estructura visual del formulario de registro de solicitudes
 * pero en modo solo lectura, mostrando únicamente los elementos seleccionados.
 */

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  FileImage,
  User,
  Download,
  Stethoscope,
  Phone,
  Mail,
  IdCard,
  Calendar,
  Printer,
  X,
  CheckCircle2,
  DollarSign,
  Scan,
  Radio,
  Clock,
  Camera,
  MessageSquare,
  History,
  ArrowRight,
  Send
} from 'lucide-react';
import type { Appointment } from '@/types';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ImagingRequestWithDetails extends Appointment {
  patientName?: string;
  doctorName?: string;
  radiographyData?: {
    id?: string;
    radiographyType?: string;
    patientData?: {
      dni?: string;
      nombres?: string;
      apellidos?: string;
      nombre?: string;
      telefono?: string;
      edad?: number | string;
      email?: string;
      motivoConsulta?: string;
    };
    doctorData?: {
      doctor?: string;
      nombre?: string;
      nombres?: string;
      apellidos?: string;
      especialidad?: string;
      colegiatura?: string;
      cop?: string;
      telefono?: string;
      email?: string;
      direccion?: string;
    };
    tomografia3D?: Record<string, any>;
    radiografias?: Record<string, any>;
    pricing?: {
      breakdown?: Array<{
        category: string;
        subcategory?: string;
        itemName: string;
        itemKey: string;
        basePrice: number;
        quantity: number;
        subtotal: number;
      }>;
      suggestedPrice?: number;
      finalPrice?: number;
      originalPrice?: number;
      counterOffer?: {
        price: number;
        userId: number;
        userName: string;
        createdAt: string;
      };
      status?: string;
    };
    status?: string;
    notes?: string;
    images?: string[];
  };
}

interface RequestDetailsModalProps {
  isOpen: boolean;
  request: ImagingRequestWithDetails;
  IMAGING_STUDY_TYPES: any;
  STUDY_STATUS: any;
  useCyanTheme: boolean;
  onClose: () => void;
  userRole?: string;
  onCounterOffer?: (requestId: number, counterOfferPrice: number) => Promise<void>;
}

// ============================================================================
// MAPEO DE LABELS
// ============================================================================

const GUIA_LABELS: Record<string, string> = {
  guiaTomografica: 'Guía Tomográfica',
  sinGuia: 'Sin Guía',
  conGuia: 'Con Guía',
  conPlanificacionQuirurgica: 'Con Planificación Quirúrgica',
  bocaAbierta: 'Boca Abierta',
  bocaCerrada: 'Boca Cerrada',
  tercioMedioSuperior: 'Tercio Medio Superior',
  tercioMedioInferior: 'Tercio Medio Inferior',
  impreso: 'Impreso',
  digital: 'No Impreso (Digital)',
  con: 'Con Asesoría',
  sin: 'Sin Asesoría'
};

// Orden de categorías de Tomografía según el formulario
const TOMO_CATEGORIES_ORDER = [
  'tipoEntrega',
  'campoPequeno',
  'campoMediano',
  'campoGrande',
  'ortodoncia',
  'otrasOpciones',
  'otros'
];

const TOMO_CATEGORIES_CONFIG: Record<string, { title: string; bgColor: string; borderColor: string; textColor: string; chipBg: string }> = {
  tipoEntrega: { title: 'TIPO DE ENTREGA', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', chipBg: 'bg-purple-100' },
  campoPequeno: { title: 'CAMPO PEQUEÑO', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', chipBg: 'bg-green-100' },
  campoMediano: { title: 'CAMPO MEDIANO', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700', chipBg: 'bg-yellow-100' },
  campoGrande: { title: 'CAMPO MEDIANO/GRANDE', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', chipBg: 'bg-orange-100' },
  ortodoncia: { title: 'ORTODONCIA', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', chipBg: 'bg-indigo-100' },
  otrasOpciones: { title: 'OTRAS OPCIONES', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', chipBg: 'bg-blue-100' },
  otros: { title: 'OTROS', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', chipBg: 'bg-gray-100' }
};

// Orden de categorías de Radiografías según el formulario
const RADIO_CATEGORIES_ORDER = [
  'periapical',
  'bitewing',
  'oclusal',
  'otrasIntraorales',
  'extraorales',
  'asesoriaOrtodoncia',
  'serviciosAdicionales',
  'analisisCefalometricos',
  'otros'
];

const RADIO_CATEGORIES_CONFIG: Record<string, { title: string; bgColor: string; borderColor: string; textColor: string; chipBg: string }> = {
  periapical: { title: 'INTRAORALES - PERIAPICAL', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700', chipBg: 'bg-pink-100' },
  bitewing: { title: 'BITEWING', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', chipBg: 'bg-blue-100' },
  oclusal: { title: 'OCLUSAL', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', chipBg: 'bg-purple-100' },
  otrasIntraorales: { title: 'OTRAS INTRAORALES', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textColor: 'text-cyan-700', chipBg: 'bg-cyan-100' },
  extraorales: { title: 'EXTRAORALES', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', chipBg: 'bg-green-100' },
  asesoriaOrtodoncia: { title: 'ASESORÍA ORTODONCIA', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'text-violet-700', chipBg: 'bg-violet-100' },
  serviciosAdicionales: { title: 'SERVICIOS ADICIONALES', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', chipBg: 'bg-amber-100' },
  analisisCefalometricos: { title: 'ANÁLISIS CEFALOMÉTRICOS', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-700', chipBg: 'bg-rose-100' },
  otros: { title: 'OTROS', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', chipBg: 'bg-gray-100' }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const RequestDetailsModal = ({
  isOpen,
  request,
  STUDY_STATUS,
  useCyanTheme,
  onClose,
  userRole,
  onCounterOffer
}: RequestDetailsModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [showCounterOfferInput, setShowCounterOfferInput] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState('');
  const [isSubmittingCounterOffer, setIsSubmittingCounterOffer] = useState(false);

  if (!isOpen) return null;

  const radiographyData = request.radiographyData;
  const patientData = radiographyData?.patientData;
  const doctorData = radiographyData?.doctorData;
  const tomografia3D = radiographyData?.tomografia3D;
  const radiografias = radiographyData?.radiografias;
  const pricing = radiographyData?.pricing;

  // Verificar si el usuario puede enviar contraoferta
  // Para solicitudes internas: el técnico puede establecer precio aunque no exista uno previo
  const canSendCounterOffer = (userRole === 'imaging_technician' || userRole === 'super_admin')
    && !pricing?.counterOffer  // Permitir si no hay pricing o no hay contraoferta previa
    && onCounterOffer;

  // Handler para enviar contraoferta
  const handleSubmitCounterOffer = async () => {
    const price = parseFloat(counterOfferPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Ingrese un precio válido');
      return;
    }

    const requestId = parseInt(request.radiographyData?.id || request.id || '0');
    if (!requestId) {
      toast.error('No se pudo identificar la solicitud');
      return;
    }

    setIsSubmittingCounterOffer(true);
    try {
      await onCounterOffer!(requestId, price);
      toast.success('Contraoferta enviada exitosamente');
      setShowCounterOfferInput(false);
      setCounterOfferPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar contraoferta');
    } finally {
      setIsSubmittingCounterOffer(false);
    }
  };

  // ============================================================================
  // Procesar TOMOGRAFÍA 3D
  // ============================================================================
  const processTomografia = () => {
    if (!tomografia3D) return {};
    const grouped: Record<string, Array<{ label: string; details?: string[]; notes?: string }>> = {};

    // TIPO DE ENTREGA
    const tipoEntrega: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.conInforme) tipoEntrega.push({ label: 'Con Informe' });
    if (tomografia3D.sinInforme) tipoEntrega.push({ label: 'Sin Informe' });
    if (tomografia3D.dicom) tipoEntrega.push({ label: 'DICOM' });
    if (tomografia3D.soloUsb) tipoEntrega.push({ label: 'Solo USB' });
    if (tipoEntrega.length) grouped['tipoEntrega'] = tipoEntrega;

    // CAMPO PEQUEÑO
    const campoPequeno: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.endodoncia) {
      const details = tomografia3D.numeroPiezasEndo ? [`Piezas: ${tomografia3D.numeroPiezasEndo}`] : undefined;
      campoPequeno.push({ label: 'Endodoncia', details });
    }
    if (tomografia3D.fracturaRadicular) {
      const details = tomografia3D.numeroPiezasFractura ? [`Piezas: ${tomografia3D.numeroPiezasFractura}`] : undefined;
      campoPequeno.push({ label: 'Fractura Radicular', details });
    }
    if (tomografia3D.anatomiaEndodontica) {
      const details = tomografia3D.numeroPiezasAnatEndo ? [`Piezas: ${tomografia3D.numeroPiezasAnatEndo}`] : undefined;
      campoPequeno.push({ label: 'Anatomía Endodóntica', details });
    }
    if (campoPequeno.length) grouped['campoPequeno'] = campoPequeno;

    // CAMPO MEDIANO
    const campoMediano: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.localizacionDiente) {
      const details = tomografia3D.numeroPiezasLoc ? [`Piezas: ${tomografia3D.numeroPiezasLoc}`] : undefined;
      campoMediano.push({ label: 'Localización de Diente Incluido', details });
    }
    if (tomografia3D.implantes) {
      const details: string[] = [];
      if (tomografia3D.numeroCortes) details.push(`Cortes: ${tomografia3D.numeroCortes}`);
      if (tomografia3D.conGuiaQx) {
        details.push('Con Guía QX');
        if (tomografia3D.tipoGuiaImplante) {
          details.push(GUIA_LABELS[tomografia3D.tipoGuiaImplante] || tomografia3D.tipoGuiaImplante);
        }
      }
      campoMediano.push({ label: 'Implantes', details: details.length ? details : undefined });
    }
    if (tomografia3D.maxilarSuperior) {
      campoMediano.push({ label: 'Maxilar Superior o Inferior (Sin informe)' });
    }
    if (campoMediano.length) grouped['campoMediano'] = campoMediano;

    // CAMPO MEDIANO/GRANDE
    const campoGrande: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.viaAerea) {
      const details = tomografia3D.tipoGuiaViaAerea
        ? [GUIA_LABELS[tomografia3D.tipoGuiaViaAerea] || tomografia3D.tipoGuiaViaAerea]
        : undefined;
      campoGrande.push({ label: 'Vía Aérea', details });
    }
    if (tomografia3D.ortognatica) {
      const details = tomografia3D.tipoOrtognatica
        ? [GUIA_LABELS[tomografia3D.tipoOrtognatica] || tomografia3D.tipoOrtognatica]
        : undefined;
      campoGrande.push({ label: 'Ortognática', details });
    }
    if (campoGrande.length) grouped['campoGrande'] = campoGrande;

    // ORTODONCIA
    const ortodoncia: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.marpe) ortodoncia.push({ label: 'MARPE' });
    if (tomografia3D.miniImplantes) {
      const details: string[] = [];
      if (tomografia3D.intraAlveolares) details.push('Intra-alveolares');
      if (tomografia3D.extraAlveolares) details.push('Extra-alveolares');
      if (tomografia3D.infracigomatico) details.push('Infracigomático');
      if (tomografia3D.buccalShelf) details.push('Buccal Shelf');
      ortodoncia.push({ label: 'Mini-implantes', details: details.length ? details : undefined });
    }
    // Opciones de guía para ortodoncia
    if ((tomografia3D.marpe || tomografia3D.miniImplantes) && tomografia3D.tipoGuiaOrtodoncia) {
      const guiaDetails: string[] = [GUIA_LABELS[tomografia3D.tipoGuiaOrtodoncia] || tomografia3D.tipoGuiaOrtodoncia];
      if (tomografia3D.tipoGuiaOrtodoncia === 'conGuia' && tomografia3D.guiaImpresa) {
        guiaDetails.push(GUIA_LABELS[tomografia3D.guiaImpresa] || tomografia3D.guiaImpresa);
      }
      ortodoncia.push({ label: 'Tipo de Guía', details: guiaDetails });
    }
    if (ortodoncia.length) grouped['ortodoncia'] = ortodoncia;

    // OTRAS OPCIONES
    const otrasOpciones: Array<{ label: string; details?: string[] }> = [];
    if (tomografia3D.atm) {
      const details = tomografia3D.tipoAtm
        ? [GUIA_LABELS[tomografia3D.tipoAtm] || tomografia3D.tipoAtm]
        : undefined;
      otrasOpciones.push({ label: 'ATM', details });
    }
    if (tomografia3D.macizoFacial) {
      const details = tomografia3D.tipoMacizoFacial
        ? [GUIA_LABELS[tomografia3D.tipoMacizoFacial] || tomografia3D.tipoMacizoFacial]
        : undefined;
      otrasOpciones.push({ label: 'Macizo Facial', details });
    }
    if (otrasOpciones.length) grouped['otrasOpciones'] = otrasOpciones;

    // OTROS (texto libre)
    if (tomografia3D.otros) {
      grouped['otros'] = [{ label: 'Especificación', notes: tomografia3D.otros }];
    }

    return grouped;
  };

  // ============================================================================
  // Procesar RADIOGRAFÍAS
  // ============================================================================
  const processRadiografias = () => {
    if (!radiografias) return {};
    const grouped: Record<string, Array<{ label: string; details?: string[]; notes?: string; teeth?: { fisico?: number[]; digital?: number[] } }>> = {};

    // PERIAPICAL - Con selector de dientes
    const periapical: Array<{ label: string; details?: string[]; teeth?: { fisico?: number[]; digital?: number[] } }> = [];

    // Dientes físico (arrays separados por tipo)
    const fisicoTeeth: number[] = [];
    if (Array.isArray(radiografias.periapicalFisico)) fisicoTeeth.push(...radiografias.periapicalFisico);
    if (Array.isArray(radiografias.dientesSuperioresFisico)) fisicoTeeth.push(...radiografias.dientesSuperioresFisico);
    if (Array.isArray(radiografias.dientesInferioresFisico)) fisicoTeeth.push(...radiografias.dientesInferioresFisico);
    if (Array.isArray(radiografias.dientesTemporalesFisico)) fisicoTeeth.push(...radiografias.dientesTemporalesFisico);

    // Dientes digital (arrays separados por tipo)
    const digitalTeeth: number[] = [];
    if (Array.isArray(radiografias.periapicalDigital)) digitalTeeth.push(...radiografias.periapicalDigital);
    if (Array.isArray(radiografias.dientesSuperioresDigital)) digitalTeeth.push(...radiografias.dientesSuperioresDigital);
    if (Array.isArray(radiografias.dientesInferioresDigital)) digitalTeeth.push(...radiografias.dientesInferioresDigital);
    if (Array.isArray(radiografias.dientesTemporalesDigital)) digitalTeeth.push(...radiografias.dientesTemporalesDigital);

    if (fisicoTeeth.length > 0 || digitalTeeth.length > 0) {
      periapical.push({
        label: 'Periapical',
        teeth: {
          fisico: fisicoTeeth.length > 0 ? [...new Set(fisicoTeeth)].sort((a, b) => a - b) : undefined,
          digital: digitalTeeth.length > 0 ? [...new Set(digitalTeeth)].sort((a, b) => a - b) : undefined
        }
      });
    }
    if (periapical.length) grouped['periapical'] = periapical;

    // BITEWING
    const bitewing: Array<{ label: string; details?: string[] }> = [];
    const bitewingMolares: string[] = [];
    if (radiografias.bitewingMolaresDerecha) bitewingMolares.push('Derecha');
    if (radiografias.bitewingMolaresIzquierda) bitewingMolares.push('Izquierda');
    if (bitewingMolares.length) bitewing.push({ label: 'Molares', details: bitewingMolares });

    const bitewingPremolares: string[] = [];
    if (radiografias.bitewingPremolaresDerecha) bitewingPremolares.push('Derecha');
    if (radiografias.bitewingPremolaresIzquierda) bitewingPremolares.push('Izquierda');
    if (bitewingPremolares.length) bitewing.push({ label: 'Premolares', details: bitewingPremolares });
    if (bitewing.length) grouped['bitewing'] = bitewing;

    // OCLUSAL
    const oclusal: Array<{ label: string }> = [];
    if (radiografias.oclusalSuperiores) oclusal.push({ label: 'Superiores' });
    if (radiografias.oclusalInferiores) oclusal.push({ label: 'Inferiores' });
    if (oclusal.length) grouped['oclusal'] = oclusal;

    // OTRAS INTRAORALES
    const otrasIntraorales: Array<{ label: string; details?: string[] }> = [];
    if (radiografias.seriada) otrasIntraorales.push({ label: 'Seriada' });
    if (radiografias.fotografias || radiografias.fotografiaIntraoral || radiografias.fotografiaExtraoral) {
      const fotos: string[] = [];
      if (radiografias.fotografiaIntraoral) fotos.push('Intraoral');
      if (radiografias.fotografiaExtraoral) fotos.push('Extraoral');
      otrasIntraorales.push({ label: 'Fotografías', details: fotos.length ? fotos : undefined });
    }
    if (otrasIntraorales.length) grouped['otrasIntraorales'] = otrasIntraorales;

    // EXTRAORALES
    const extraorales: Array<{ label: string; details?: string[] }> = [];

    // Tipo físico/digital
    const extraoralTipo = radiografias.extraoralTipo || [];
    if (extraoralTipo.length) {
      extraorales.push({ label: 'Formato', details: extraoralTipo.map((t: string) => t === 'fisico' ? 'Físico' : 'Digital') });
    }

    if (radiografias.extraoralPanoramica) extraorales.push({ label: 'Radiografía Panorámica' });
    if (radiografias.extraoralCefalometrica) extraorales.push({ label: 'Radiografía Cefalométrica' });

    if (radiografias.extraoralCarpal || radiografias.carpalFishman || radiografias.carpalTtw2) {
      const carpalDetails: string[] = [];
      if (radiografias.carpalFishman) carpalDetails.push('Fishman');
      if (radiografias.carpalTtw2) carpalDetails.push('TTW2');
      extraorales.push({ label: 'Radiografía Carpal (Edad Ósea)', details: carpalDetails.length ? carpalDetails : undefined });
    }

    if (radiografias.extraoralPosteriorAnterior || radiografias.posteriorAnteriorRicketts) {
      const paDetails: string[] = [];
      if (radiografias.posteriorAnteriorRicketts) paDetails.push('Ricketts');
      extraorales.push({ label: 'Radiografía Posterior Anterior (Frontal)', details: paDetails.length ? paDetails : undefined });
    }

    if (radiografias.extraoralAtmAbierta) extraorales.push({ label: 'Estudio ATM (Boca abierta)' });
    if (radiografias.extraoralAtmCerrada) extraorales.push({ label: 'Estudio ATM (Boca cerrada)' });
    if (extraorales.length) grouped['extraorales'] = extraorales;

    // ASESORÍA ORTODONCIA
    const asesoriaOrtodoncia: Array<{ label: string; details?: string[] }> = [];

    // Tipo físico/digital
    const ortodonciaTipo = radiografias.ortodonciaTipo || [];
    if (ortodonciaTipo.length) {
      asesoriaOrtodoncia.push({ label: 'Formato', details: ortodonciaTipo.map((t: string) => t === 'fisico' ? 'Físico' : 'Digital') });
    }

    // Paquete seleccionado
    if (radiografias.ortodonciaPaquete) {
      const paqDetails: string[] = [];
      if (radiografias.ortodonciaPlanTratamiento) {
        paqDetails.push(radiografias.ortodonciaPlanTratamiento === 'con' ? 'Con plan de tratamiento' : 'Sin plan de tratamiento');
      }
      asesoriaOrtodoncia.push({ label: `Paquete ${radiografias.ortodonciaPaquete}`, details: paqDetails.length ? paqDetails : undefined });
    }
    if (asesoriaOrtodoncia.length) grouped['asesoriaOrtodoncia'] = asesoriaOrtodoncia;

    // SERVICIOS ADICIONALES
    const serviciosAdicionales: Array<{ label: string; details?: string[] }> = [];

    if (radiografias.ortodonciaAlineadores || radiografias.alineadoresPlanificacion || radiografias.alineadoresImpresion) {
      const alineadoresDetails: string[] = [];
      if (radiografias.alineadoresPlanificacion) alineadoresDetails.push('Plan de tratamiento (sin archivo digital STL)');
      if (radiografias.alineadoresImpresion) alineadoresDetails.push('Impresión y papel+cera');
      serviciosAdicionales.push({ label: 'Alineadores Invisibles', details: alineadoresDetails.length ? alineadoresDetails : undefined });
    }

    if (radiografias.ortodonciaEscaneo || radiografias.escaneoIntraoral || radiografias.escaneoIntraoralZocalo || radiografias.escaneoIntraoralInforme) {
      const escaneoDetails: string[] = [];
      if (radiografias.escaneoIntraoral) escaneoDetails.push('Escaneo Intraoral');
      if (radiografias.escaneoIntraoralZocalo) escaneoDetails.push('Escaneo Intraoral con Zócalo');
      if (radiografias.escaneoIntraoralInforme) escaneoDetails.push('Escaneo Intraoral sin informe');
      serviciosAdicionales.push({ label: 'Escaneo Intraoral Digital', details: escaneoDetails.length ? escaneoDetails : undefined });
    }

    if (radiografias.ortodonciaImpresion || radiografias.modelosDigitalesConInforme || radiografias.modelosDigitalesSinInforme || radiografias.modelosImpresionDigital) {
      const modelosDetails: string[] = [];
      if (radiografias.modelosDigitalesConInforme) modelosDetails.push('Modelos Digitales con informe');
      if (radiografias.modelosDigitalesSinInforme) modelosDetails.push('Modelos Digitales sin informe');
      if (radiografias.modelosImpresionDigital) modelosDetails.push('Impresión digital');
      serviciosAdicionales.push({ label: 'Modelos de Estudio 3D', details: modelosDetails.length ? modelosDetails : undefined });
    }
    if (serviciosAdicionales.length) grouped['serviciosAdicionales'] = serviciosAdicionales;

    // ANÁLISIS CEFALOMÉTRICOS
    const analisisCefalometricos: Array<{ label: string }> = [];
    if (radiografias.analisisRicketts) analisisCefalometricos.push({ label: 'Ricketts' });
    if (radiografias.analisisSchwartz) analisisCefalometricos.push({ label: 'Schwartz' });
    if (radiografias.analisisSteiner) analisisCefalometricos.push({ label: 'Steiner' });
    if (radiografias.analisisMcNamara) analisisCefalometricos.push({ label: 'Mc Namara' });
    if (radiografias.analisisTweed) analisisCefalometricos.push({ label: 'Tweed' });
    if (radiografias.analisisDowns) analisisCefalometricos.push({ label: 'Downs' });
    if (radiografias.analisisBjorks) analisisCefalometricos.push({ label: 'Bjorks' });
    if (radiografias.analisisUSP) analisisCefalometricos.push({ label: 'U.S.P' });
    if (radiografias.analisisRotJarabak) analisisCefalometricos.push({ label: 'Rot-h-Jarabak' });
    if (radiografias.analisisTejidosBlancos) analisisCefalometricos.push({ label: 'Tejidos Blancos' });
    if (analisisCefalometricos.length) grouped['analisisCefalometricos'] = analisisCefalometricos;

    // OTROS
    if (radiografias.analisisOtros) {
      grouped['otros'] = [{ label: 'Especificación', notes: radiografias.analisisOtros }];
    }

    return grouped;
  };

  const tomografiaData = processTomografia();
  const radiografiasData = processRadiografias();
  const hasTomografia = Object.keys(tomografiaData).length > 0;
  const hasRadiografias = Object.keys(radiografiasData).length > 0;

  // ============================================================================
  // Exportar a PDF - Generación nativa replicando el formato del modal
  // ============================================================================
  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Configuración de márgenes
      const margin = 12;
      const contentWidth = pdfWidth - (margin * 2);
      let y = margin;

      // Colores del tema cyan/teal
      const cyanDark: [number, number, number] = [0, 128, 128];
      const cyanLight: [number, number, number] = [0, 150, 150];
      const tealBg: [number, number, number] = [240, 253, 250];
      const white: [number, number, number] = [255, 255, 255];
      const darkText: [number, number, number] = [31, 41, 55];
      const grayText: [number, number, number] = [107, 114, 128];
      const lightBorder: [number, number, number] = [229, 231, 235];

      // Colores para categorías
      const colors = {
        purple: { bg: [243, 232, 255] as [number, number, number], border: [192, 132, 252] as [number, number, number], text: [107, 33, 168] as [number, number, number] },
        green: { bg: [220, 252, 231] as [number, number, number], border: [74, 222, 128] as [number, number, number], text: [21, 128, 61] as [number, number, number] },
        yellow: { bg: [254, 249, 195] as [number, number, number], border: [250, 204, 21] as [number, number, number], text: [161, 98, 7] as [number, number, number] },
        orange: { bg: [255, 237, 213] as [number, number, number], border: [251, 146, 60] as [number, number, number], text: [194, 65, 12] as [number, number, number] },
        indigo: { bg: [224, 231, 255] as [number, number, number], border: [129, 140, 248] as [number, number, number], text: [67, 56, 202] as [number, number, number] },
        blue: { bg: [219, 234, 254] as [number, number, number], border: [96, 165, 250] as [number, number, number], text: [29, 78, 216] as [number, number, number] },
        pink: { bg: [252, 231, 243] as [number, number, number], border: [244, 114, 182] as [number, number, number], text: [190, 24, 93] as [number, number, number] },
        cyan: { bg: [207, 250, 254] as [number, number, number], border: [34, 211, 238] as [number, number, number], text: [14, 116, 144] as [number, number, number] },
        teal: { bg: [204, 251, 241] as [number, number, number], border: [45, 212, 191] as [number, number, number], text: [15, 118, 110] as [number, number, number] },
        violet: { bg: [237, 233, 254] as [number, number, number], border: [167, 139, 250] as [number, number, number], text: [109, 40, 217] as [number, number, number] },
        amber: { bg: [254, 243, 199] as [number, number, number], border: [251, 191, 36] as [number, number, number], text: [180, 83, 9] as [number, number, number] },
        rose: { bg: [255, 228, 230] as [number, number, number], border: [251, 113, 133] as [number, number, number], text: [190, 18, 60] as [number, number, number] },
        gray: { bg: [243, 244, 246] as [number, number, number], border: [156, 163, 175] as [number, number, number], text: [55, 65, 81] as [number, number, number] },
        emerald: { bg: [209, 250, 229] as [number, number, number], border: [52, 211, 153] as [number, number, number], text: [4, 120, 87] as [number, number, number] }
      };

      // Cargar el logo
      const logoUrl = '/GENESIS-PANOCEF-final-01.png';
      let logoLoaded = false;
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve) => {
        logoImg.onload = () => { logoLoaded = true; resolve(); };
        logoImg.onerror = () => resolve();
        logoImg.src = logoUrl;
      });

      // ========== FUNCIONES HELPER ==========
      const checkPageBreak = (requiredHeight: number) => {
        if (y + requiredHeight > pdfHeight - 15) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const drawRoundedRect = (x: number, yPos: number, w: number, h: number, r: number, fillColor: [number, number, number], borderColor?: [number, number, number]) => {
        pdf.setFillColor(...fillColor);
        pdf.roundedRect(x, yPos, w, h, r, r, 'F');
        if (borderColor) {
          pdf.setDrawColor(...borderColor);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(x, yPos, w, h, r, r, 'S');
        }
      };

      const drawSectionHeader = (title: string, bgGradientStart: [number, number, number]) => {
        checkPageBreak(15);
        drawRoundedRect(margin, y, contentWidth, 10, 2, bgGradientStart);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkText);
        pdf.text(title, margin + 4, y + 6.5);
        y += 14;
      };

      const drawFieldLabel = (label: string, x: number) => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...grayText);
        pdf.text(label.toUpperCase(), x, y);
      };

      const drawFieldValue = (value: string, x: number, maxWidth: number) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkText);
        const truncated = value.length > 35 ? value.substring(0, 32) + '...' : value;
        pdf.text(truncated || '-', x, y + 4.5);
      };

      const drawFieldBox = (label: string, value: string, x: number, width: number) => {
        // Fondo del campo
        drawRoundedRect(x, y - 1, width - 2, 12, 1.5, [249, 250, 251], lightBorder);
        drawFieldLabel(label, x + 2);
        drawFieldValue(value, x + 2, width - 4);
      };

      const drawCategorySection = (title: string, colorScheme: { bg: [number, number, number]; border: [number, number, number]; text: [number, number, number] }) => {
        checkPageBreak(10);
        drawRoundedRect(margin + 2, y, contentWidth - 4, 7, 1.5, colorScheme.bg, colorScheme.border);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colorScheme.text);
        pdf.text(title, margin + 5, y + 4.5);
        y += 10;
      };

      const drawStudyItem = (label: string, details?: string[], notes?: string, colorScheme?: { bg: [number, number, number]; text: [number, number, number] }) => {
        checkPageBreak(15);
        const itemColor = colorScheme || colors.cyan;

        // Checkbox marcado (cuadrado con X)
        drawRoundedRect(margin + 4, y - 2.5, 4, 4, 0.5, cyanLight);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...white);
        pdf.text('x', margin + 5.1, y + 0.3);

        // Label
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkText);
        pdf.text(label, margin + 12, y);
        y += 4;

        // Detalles como chips
        if (details && details.length > 0) {
          let chipX = margin + 12;
          details.forEach((detail, idx) => {
            const chipWidth = pdf.getTextWidth(detail) + 4;
            if (chipX + chipWidth > pdfWidth - margin) {
              chipX = margin + 12;
              y += 5;
            }
            drawRoundedRect(chipX, y - 3, chipWidth, 5, 1, itemColor.bg);
            pdf.setFontSize(7);
            pdf.setTextColor(...itemColor.text);
            pdf.text(detail, chipX + 2, y);
            chipX += chipWidth + 2;
          });
          y += 4;
        }

        // Notas
        if (notes) {
          checkPageBreak(8);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(...grayText);
          const splitNotes = pdf.splitTextToSize(`Nota: ${notes}`, contentWidth - 20);
          pdf.text(splitNotes, margin + 12, y);
          y += splitNotes.length * 3.5;
        }

        y += 2;
      };

      const drawTeethSection = (fisico?: number[], digital?: number[]) => {
        if (fisico && fisico.length > 0) {
          checkPageBreak(12);
          // Badge FÍSICO
          drawRoundedRect(margin + 12, y - 3, 12, 5, 1, [252, 231, 243]);
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(190, 24, 93);
          pdf.text('FÍSICO', margin + 13, y);

          pdf.setFontSize(7);
          pdf.setTextColor(...grayText);
          pdf.text(`${fisico.length} dientes`, margin + 26, y);
          y += 5;

          // Dientes
          let toothX = margin + 12;
          fisico.forEach(tooth => {
            if (toothX + 7 > pdfWidth - margin) {
              toothX = margin + 12;
              y += 6;
            }
            drawRoundedRect(toothX, y - 4, 6, 6, 1, [236, 72, 153]);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...white);
            pdf.text(tooth.toString(), toothX + 1.5, y);
            toothX += 7;
          });
          y += 5;
        }

        if (digital && digital.length > 0) {
          checkPageBreak(12);
          // Badge DIGITAL
          drawRoundedRect(margin + 12, y - 3, 14, 5, 1, [219, 234, 254]);
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(29, 78, 216);
          pdf.text('DIGITAL', margin + 13, y);

          pdf.setFontSize(7);
          pdf.setTextColor(...grayText);
          pdf.text(`${digital.length} dientes`, margin + 28, y);
          y += 5;

          // Dientes
          let toothX = margin + 12;
          digital.forEach(tooth => {
            if (toothX + 7 > pdfWidth - margin) {
              toothX = margin + 12;
              y += 6;
            }
            drawRoundedRect(toothX, y - 4, 6, 6, 1, [59, 130, 246]);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...white);
            pdf.text(tooth.toString(), toothX + 1.5, y);
            toothX += 7;
          });
          y += 5;
        }
      };

      // ========== HEADER CON LOGO ==========
      // Fondo del header
      drawRoundedRect(margin, y, contentWidth, 22, 3, cyanDark);

      // Logo
      if (logoLoaded && logoImg.naturalWidth > 0) {
        const logoWidth = 40;
        const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;
        pdf.addImage(logoImg, 'PNG', margin + 3, y + 3, logoWidth, Math.min(logoHeight, 16));
      }

      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...white);
      pdf.text('SOLICITUD DE ESTUDIO', pdfWidth / 2, y + 9, { align: 'center' });

      // Tipo de estudio
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(200, 230, 230);
      pdf.text(radiographyData?.radiographyType || 'Estudio de Imágenes', pdfWidth / 2, y + 15, { align: 'center' });

      // Fecha
      const dateStr = new Date(request.date).toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
      pdf.setFontSize(8);
      pdf.setTextColor(...white);
      pdf.text(dateStr, pdfWidth - margin - 3, y + 8, { align: 'right' });

      // Hora
      const timeStr = new Date(request.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      pdf.text(timeStr, pdfWidth - margin - 3, y + 13, { align: 'right' });

      y += 28;

      // ========== DATOS DEL PACIENTE ==========
      drawSectionHeader('DATOS DEL PACIENTE', tealBg);

      const col1 = margin;
      const col2 = margin + contentWidth / 3;
      const col3 = margin + (contentWidth / 3) * 2;
      const colHalf1 = margin;
      const colHalf2 = margin + contentWidth / 2;

      // Fila 1: DNI, Edad
      drawFieldBox('DNI', patientData?.dni || '-', col1, contentWidth / 3);
      drawFieldBox('EDAD', patientData?.edad ? `${patientData.edad} años` : '-', col2, contentWidth / 3);
      y += 15;

      // Fila 2: Nombres, Apellidos
      const pName = patientData?.nombres || patientData?.nombre?.split(' ')[0] || '-';
      const pLastName = patientData?.apellidos || patientData?.nombre?.split(' ').slice(1).join(' ') || '-';
      drawFieldBox('NOMBRES', pName, colHalf1, contentWidth / 2);
      drawFieldBox('APELLIDOS', pLastName, colHalf2, contentWidth / 2);
      y += 15;

      // Fila 3: Teléfono, Email
      drawFieldBox('TELÉFONO', patientData?.telefono || '-', colHalf1, contentWidth / 2);
      drawFieldBox('EMAIL', patientData?.email || '-', colHalf2, contentWidth / 2);
      y += 18;

      // ========== DATOS DEL ODONTÓLOGO ==========
      drawSectionHeader('DATOS DEL ODONTOLOGO', [240, 253, 250]);

      const dName = doctorData?.nombres || doctorData?.nombre?.split(' ')[0] || doctorData?.doctor?.replace('Dr. ', '').split(' ')[0] || '-';
      const dLastName = doctorData?.apellidos || doctorData?.nombre?.split(' ').slice(1).join(' ') || '-';

      // Fila 1: Nombres, Apellidos
      drawFieldBox('NOMBRES', dName, colHalf1, contentWidth / 2);
      drawFieldBox('APELLIDOS', dLastName, colHalf2, contentWidth / 2);
      y += 15;

      // Fila 2: COP, Especialidad
      drawFieldBox('COP', doctorData?.colegiatura || doctorData?.cop || '-', colHalf1, contentWidth / 2);
      drawFieldBox('ESPECIALIDAD', doctorData?.especialidad || '-', colHalf2, contentWidth / 2);
      y += 15;

      // Fila 3: Teléfono, Email
      drawFieldBox('TELÉFONO', doctorData?.telefono || '-', colHalf1, contentWidth / 2);
      drawFieldBox('EMAIL', doctorData?.email || '-', colHalf2, contentWidth / 2);
      y += 18;

      // ========== TOMOGRAFÍA 3D ==========
      if (hasTomografia) {
        drawSectionHeader('TOMOGRAFIA 3D', [207, 250, 254]);

        const tomoColors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
          tipoEntrega: colors.purple,
          campoPequeno: colors.green,
          campoMediano: colors.yellow,
          campoGrande: colors.orange,
          ortodoncia: colors.indigo,
          otrasOpciones: colors.blue,
          otros: colors.gray
        };

        TOMO_CATEGORIES_ORDER.forEach(catKey => {
          const items = tomografiaData[catKey];
          if (!items || items.length === 0) return;

          const config = TOMO_CATEGORIES_CONFIG[catKey];
          const colorScheme = tomoColors[catKey] || colors.cyan;

          drawCategorySection(config.title, { bg: colorScheme.bg, border: colorScheme.bg, text: colorScheme.text });

          items.forEach((item: { label: string; details?: string[]; notes?: string }) => {
            drawStudyItem(item.label, item.details, item.notes, colorScheme);
          });
        });
        y += 5;
      }

      // ========== RADIOGRAFÍAS ==========
      if (hasRadiografias) {
        checkPageBreak(20);
        drawSectionHeader('RADIOGRAFIAS', [204, 251, 241]);

        const radioColors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
          periapical: colors.pink,
          bitewing: colors.blue,
          oclusal: colors.purple,
          otrasIntraorales: colors.cyan,
          extraorales: colors.green,
          asesoriaOrtodoncia: colors.violet,
          serviciosAdicionales: colors.amber,
          analisisCefalometricos: colors.rose,
          otros: colors.gray
        };

        RADIO_CATEGORIES_ORDER.forEach(catKey => {
          const items = radiografiasData[catKey];
          if (!items || items.length === 0) return;

          const config = RADIO_CATEGORIES_CONFIG[catKey];
          const colorScheme = radioColors[catKey] || colors.teal;

          drawCategorySection(config.title, { bg: colorScheme.bg, border: colorScheme.bg, text: colorScheme.text });

          items.forEach((item: { label: string; details?: string[]; notes?: string; teeth?: { fisico?: number[]; digital?: number[] } }) => {
            drawStudyItem(item.label, item.details, item.notes, colorScheme);

            // Mostrar dientes para periapical
            if (item.teeth) {
              drawTeethSection(item.teeth.fisico, item.teeth.digital);
            }
          });
        });
        y += 5;
      }

      // ========== DESGLOSE DE PRECIOS ==========
      if (pricing && pricing.breakdown && pricing.breakdown.length > 0) {
        checkPageBreak(30);
        drawSectionHeader('DESGLOSE DE PRECIOS', [209, 250, 229]);

        pricing.breakdown.forEach((item: any) => {
          checkPageBreak(8);

          // Soportar ambos formatos: { service, price } (DiagnosticPlanStep) y { itemName, subtotal, ... } (otros)
          const displayName = item.itemName || item.service || 'Item';
          const displayPrice = item.subtotal ?? item.price ?? 0;
          const displayQuantity = item.quantity || 1;

          // Fondo de fila
          drawRoundedRect(margin + 2, y - 3, contentWidth - 4, 7, 1, [249, 250, 251]);

          // Nombre del item
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...darkText);
          const itemText = displayQuantity > 1 ? `${displayName} (x${displayQuantity})` : displayName;
          pdf.text(itemText, margin + 5, y);

          // Precio
          pdf.setFont('helvetica', 'bold');
          pdf.text(`S/ ${displayPrice.toFixed(2)}`, pdfWidth - margin - 5, y, { align: 'right' });
          y += 8;
        });

        // Línea de total
        y += 3;
        pdf.setDrawColor(...lightBorder);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, pdfWidth - margin, y);
        y += 6;

        // Total
        drawRoundedRect(margin + 2, y - 4, contentWidth - 4, 10, 2, cyanLight);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...white);
        pdf.text('TOTAL:', margin + 8, y + 2);
        pdf.text(`S/ ${(pricing.finalPrice || pricing.suggestedPrice || 0).toFixed(2)}`, pdfWidth - margin - 8, y + 2, { align: 'right' });
        y += 15;
      }

      // ========== NOTAS ==========
      const notesContent = request.notes || radiographyData?.notes || patientData?.motivoConsulta;
      if (notesContent) {
        checkPageBreak(25);
        drawSectionHeader('INDICACIONES / NOTAS', [254, 243, 199]);

        drawRoundedRect(margin + 2, y - 2, contentWidth - 4, 20, 2, [255, 251, 235], [251, 191, 36]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...darkText);
        const splitNotes = pdf.splitTextToSize(notesContent, contentWidth - 12);
        pdf.text(splitNotes, margin + 6, y + 3);
        y += Math.max(20, splitNotes.length * 4 + 8);
      }

      // ========== FOOTER EN TODAS LAS PÁGINAS ==========
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Línea de footer
        pdf.setDrawColor(...lightBorder);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pdfHeight - 12, pdfWidth - margin, pdfHeight - 12);

        // Texto del footer
        pdf.setFontSize(7);
        pdf.setTextColor(...grayText);
        pdf.text(`Página ${i} de ${totalPages}`, pdfWidth / 2, pdfHeight - 7, { align: 'center' });
        pdf.text('PANOCEF - Centro de Diagnóstico por Imágenes', pdfWidth / 2, pdfHeight - 4, { align: 'center' });
      }

      // Guardar PDF
      const patientNameForFile = patientData?.nombres || patientData?.nombre || request.patientName || 'Paciente';
      const dateFile = formatDateToYMD(new Date(request.date));
      pdf.save(`Solicitud_${patientNameForFile.replace(/\s+/g, '_')}_${dateFile}.pdf`);

    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  // ============================================================================
  // Componentes auxiliares
  // ============================================================================

  // Campo de solo lectura compacto
  const ReadOnlyField = ({ label, value, icon: Icon }: { label: string; value?: string | number; icon?: any }) => (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</label>
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        <span className="text-gray-900 font-medium truncate">{value || '-'}</span>
      </div>
    </div>
  );

  // Componente para renderizar dientes seleccionados
  const TeethDisplay = ({ fisico, digital }: { fisico?: number[]; digital?: number[] }) => (
    <div className="mt-2 space-y-2">
      {fisico && fisico.length > 0 && (
        <div className="bg-pink-100 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-pink-800 bg-pink-200 px-2 py-0.5 rounded">FÍSICO</span>
            <span className="text-xs text-pink-600">{fisico.length} dientes</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {fisico.map((tooth) => (
              <span key={`f-${tooth}`} className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold bg-pink-500 text-white rounded">
                {tooth}
              </span>
            ))}
          </div>
        </div>
      )}
      {digital && digital.length > 0 && (
        <div className="bg-blue-100 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded">DIGITAL</span>
            <span className="text-xs text-blue-600">{digital.length} dientes</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {digital.map((tooth) => (
              <span key={`d-${tooth}`} className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold bg-blue-500 text-white rounded">
                {tooth}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Item de estudio con detalles
  const StudyItem = ({ item, chipBg, textColor }: {
    item: { label: string; details?: string[]; notes?: string; teeth?: { fisico?: number[]; digital?: number[] } };
    chipBg: string;
    textColor: string;
  }) => (
    <div className={`${chipBg} rounded-lg p-2 border ${chipBg.replace('bg-', 'border-').replace('-100', '-200').replace('-50', '-200')}`}>
      <div className="flex items-start gap-2">
        <CheckCircle2 className={`w-4 h-4 ${textColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm ${textColor}`}>{item.label}</span>
          {item.details && item.details.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.details.map((detail, idx) => (
                <span key={idx} className={`text-xs px-2 py-0.5 rounded ${chipBg} ${textColor} border ${chipBg.replace('bg-', 'border-').replace('-100', '-300').replace('-50', '-300')}`}>
                  {detail}
                </span>
              ))}
            </div>
          )}
          {item.notes && (
            <div className="mt-2 flex items-start gap-1.5 bg-white/50 rounded p-2">
              <MessageSquare className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
          {item.teeth && <TeethDisplay fisico={item.teeth.fisico} digital={item.teeth.digital} />}
        </div>
      </div>
    </div>
  );

  // Sección de categoría
  const CategorySection = ({
    items,
    config
  }: {
    items: Array<{ label: string; details?: string[]; notes?: string; teeth?: { fisico?: number[]; digital?: number[] } }>;
    config: { title: string; bgColor: string; borderColor: string; textColor: string; chipBg: string };
  }) => (
    <div className={`rounded-lg p-3 ${config.bgColor} border ${config.borderColor}`}>
      <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${config.textColor}`}>
        {config.title}
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <StudyItem key={idx} item={item} chipBg={config.chipBg} textColor={config.textColor} />
        ))}
      </div>
    </div>
  );

  const headerBg = useCyanTheme ? 'bg-gradient-to-r from-cyan-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600';
  const accentColor = useCyanTheme ? 'text-cyan-600' : 'text-purple-600';
  const accentBg = useCyanTheme ? 'bg-cyan-50 border-cyan-200' : 'bg-purple-50 border-purple-200';

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={`${headerBg} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileImage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Detalles de la Solicitud</h1>
                <p className="text-sm text-white/80">{radiographyData?.radiographyType || 'Estudio de Imágenes'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
                {STUDY_STATUS[request.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS]?.label || 'Pendiente'}
              </span>

              {pricing && (
                <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <p className="text-[10px] font-medium text-white/70">Total</p>
                      <p className="text-lg font-bold">S/ {(pricing.finalPrice || pricing.suggestedPrice || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button onClick={() => window.print()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <Printer className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={printRef}>

          {/* Información de la solicitud */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Fecha:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(request.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Hora:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(request.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de 2 columnas para Paciente y Doctor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Datos del Paciente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentBg}`}>
                  <User className={`w-4 h-4 ${accentColor}`} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Datos del Paciente</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ReadOnlyField label="DNI" value={patientData?.dni} icon={IdCard} />
                <ReadOnlyField label="Edad" value={patientData?.edad ? `${patientData.edad} años` : undefined} />
                <ReadOnlyField label="Nombres" value={patientData?.nombres || patientData?.nombre?.split(' ')[0]} icon={User} />
                <ReadOnlyField label="Apellidos" value={patientData?.apellidos || patientData?.nombre?.split(' ').slice(1).join(' ')} />
                <ReadOnlyField label="Teléfono" value={patientData?.telefono} icon={Phone} />
                <ReadOnlyField label="Email" value={patientData?.email} icon={Mail} />
              </div>
            </div>

            {/* Datos del Doctor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Datos del Odontólogo</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ReadOnlyField
                  label="Nombres"
                  value={doctorData?.nombres || doctorData?.nombre?.split(' ')[0] || doctorData?.doctor?.replace('Dr. ', '').split(' ')[0]}
                  icon={User}
                />
                <ReadOnlyField
                  label="Apellidos"
                  value={doctorData?.apellidos || doctorData?.nombre?.split(' ').slice(1).join(' ') || doctorData?.doctor?.replace('Dr. ', '').split(' ').slice(1).join(' ')}
                />
                <ReadOnlyField label="COP" value={doctorData?.colegiatura || doctorData?.cop} icon={IdCard} />
                <ReadOnlyField label="Especialidad" value={doctorData?.especialidad} icon={Stethoscope} />
                <ReadOnlyField label="Teléfono" value={doctorData?.telefono} icon={Phone} />
                <ReadOnlyField label="Email" value={doctorData?.email} icon={Mail} />
              </div>
            </div>
          </div>

          {/* ESTUDIOS SOLICITADOS - Grid de 2 columnas */}
          {(hasTomografia || hasRadiografias) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tomografía 3D */}
              {hasTomografia && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scan className="w-5 h-5 text-cyan-600" />
                        <span className="font-bold text-gray-800">Tomografía 3D</span>
                      </div>
                      <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">
                        {Object.values(tomografiaData).flat().length} items
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                    {TOMO_CATEGORIES_ORDER.map((catKey) => {
                      const items = tomografiaData[catKey];
                      if (!items || items.length === 0) return null;
                      const config = TOMO_CATEGORIES_CONFIG[catKey];
                      return (
                        <CategorySection
                          key={catKey}
                          items={items}
                          config={config}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Radiografías */}
              {hasRadiografias && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-teal-600" />
                        <span className="font-bold text-gray-800">Radiografías</span>
                      </div>
                      <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                        {Object.values(radiografiasData).flat().length} items
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                    {RADIO_CATEGORIES_ORDER.map((catKey) => {
                      const items = radiografiasData[catKey];
                      if (!items || items.length === 0) return null;
                      const config = RADIO_CATEGORIES_CONFIG[catKey];
                      return (
                        <CategorySection
                          key={catKey}
                          items={items}
                          config={config}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DESGLOSE DE PRECIOS */}
          {pricing && pricing.breakdown && pricing.breakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-gray-800">Desglose de Precios</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {pricing.breakdown.length} items
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {pricing.breakdown.map((item: any, index) => {
                    // Soportar ambos formatos: { service, price } (DiagnosticPlanStep) y { itemName, subtotal, ... } (otros)
                    const displayName = item.itemName || item.service || 'Item';
                    const displayPrice = item.subtotal ?? item.price ?? 0;
                    const displayQuantity = item.quantity || 1;

                    return (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.category === 'tomografia3D' ? 'bg-cyan-500' :
                            item.category === 'intraoral' ? 'bg-blue-500' :
                            item.category === 'extraoral' ? 'bg-purple-500' :
                            item.category === 'ortodoncias' ? 'bg-teal-500' :
                            'bg-orange-500'
                          }`}></span>
                          <span className="text-gray-800 truncate">{displayName}</span>
                          {displayQuantity > 1 && (
                            <span className="text-gray-400 text-xs">x{displayQuantity}</span>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">S/ {displayPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className={`text-2xl font-bold ${accentColor}`}>
                    S/ {(pricing.finalPrice || pricing.suggestedPrice || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* HISTORIAL DE PRECIOS */}
                {(pricing.counterOffer || pricing.originalPrice) && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Historial de Precios</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      {/* Precio original */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Precio original:</span>
                        <span className="font-medium text-gray-900">
                          S/ {(pricing.originalPrice || pricing.suggestedPrice || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {/* Contraoferta */}
                      {pricing.counterOffer && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Contraoferta:</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-700">
                              S/ {pricing.counterOffer.price.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-emerald-600 text-xs ml-1">✓ FINAL</span>
                          </div>
                        </div>
                      )}
                      {/* Info del técnico que hizo la contraoferta */}
                      {pricing.counterOffer && (
                        <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                          Por: {pricing.counterOffer.userName} • {new Date(pricing.counterOffer.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BOTÓN CONTRAOFERTA */}
                {canSendCounterOffer && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    {!showCounterOfferInput ? (
                      <button
                        onClick={() => setShowCounterOfferInput(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors font-medium text-sm border border-amber-200"
                      >
                        <DollarSign className="w-4 h-4" />
                        Enviar Contraoferta
                      </button>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <label className="block text-sm font-medium text-amber-800 mb-2">
                          Nuevo precio (S/)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={counterOfferPrice}
                            onChange={(e) => setCounterOfferPrice(e.target.value)}
                            placeholder="Ej: 120.00"
                            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                            disabled={isSubmittingCounterOffer}
                          />
                          <button
                            onClick={handleSubmitCounterOffer}
                            disabled={isSubmittingCounterOffer || !counterOfferPrice}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isSubmittingCounterOffer ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Enviar
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowCounterOfferInput(false);
                              setCounterOfferPrice('');
                            }}
                            disabled={isSubmittingCounterOffer}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Este precio será definitivo y se registrará como ingreso
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTAS / INDICACIONES */}
          {(request.notes || radiographyData?.notes || patientData?.motivoConsulta) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-gray-800">Indicaciones / Notas</span>
                </div>
              </div>
              <div className="p-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {request.notes || radiographyData?.notes || patientData?.motivoConsulta}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* IMÁGENES DEL ESTUDIO */}
          {((request.imagingStudy?.images && request.imagingStudy.images.length > 0) ||
            (radiographyData?.images && radiographyData.images.length > 0)) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className={`px-4 py-3 border-b border-gray-200 ${accentBg}`}>
                <div className="flex items-center gap-2">
                  <Camera className={`w-5 h-5 ${accentColor}`} />
                  <span className="font-bold text-gray-800">Imágenes del Estudio</span>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[...(request.imagingStudy?.images || []), ...(radiographyData?.images || [])].map((image, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {typeof image === 'string' && image.startsWith('data:image/') ? (
                        <img src={image} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (typeof image === 'string') {
                            const link = document.createElement('a');
                            link.href = image;
                            link.download = `imagen-${index + 1}.png`;
                            link.click();
                          }
                        }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
