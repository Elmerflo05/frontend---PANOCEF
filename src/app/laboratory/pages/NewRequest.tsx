/**
 * Nueva Solicitud de Radiografía/Tomografía
 *
 * Componente para que el Técnico de Imágenes pueda crear nuevas solicitudes
 * de estudios radiológicos internamente.
 *
 * Integrado con:
 * - radiographyApi: Para crear solicitudes en la base de datos
 * - laboratoryServicePricesApi: Para obtener los precios configurados por el superadmin
 * - LaboratoryFormUnified: Formulario unificado reutilizable
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  PlusCircle,
  ArrowLeft,
  Save,
  Calculator,
  FileImage,
  User,
  Stethoscope,
  AlertCircle,
  Search,
  CheckCircle2,
  UserX
} from 'lucide-react';

import { LaboratoryFormUnified } from '@/components/laboratory-form/LaboratoryFormUnified';
import {
  type Tomografia3DFormData,
  type RadiografiasFormData,
  type PatientData,
  type DoctorData,
  type Tomografia3DPricing,
  type RadiografiasPricing,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  INITIAL_PATIENT_DATA,
  INITIAL_DOCTOR_DATA,
  DEFAULT_TOMOGRAFIA_PRICING,
  DEFAULT_RADIOGRAFIAS_PRICING
} from '@/components/laboratory-form/types';

import { radiographyApi, type PanoCefPriceBreakdownItem } from '@/services/api/radiographyApi';
import { laboratoryServicePricesApi } from '@/services/api/laboratoryServicePricesApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { useAuthStore } from '@/store/authStore';

const NewRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Verificar si es cliente externo (odontólogo)
  const isExternalClient = user?.role === 'external_client';

  // Estados del formulario
  const [tomografiaData, setTomografiaData] = useState<Tomografia3DFormData>(INITIAL_TOMOGRAFIA_FORM);
  const [radiografiasData, setRadiografiasData] = useState<RadiografiasFormData>(INITIAL_RADIOGRAFIAS_FORM);
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [doctorData, setDoctorData] = useState<DoctorData>(INITIAL_DOCTOR_DATA);

  // Autocompletar datos del odontólogo si es external_client
  // Los datos vienen de users.profile (licenseNumber, specialty)
  useEffect(() => {
    if (isExternalClient && user) {
      setDoctorData({
        nombres: user.profile?.firstName || '',
        apellidos: user.profile?.lastName || '',
        cop: user.profile?.licenseNumber || '',
        especialidad: user.profile?.specialty || '', // Leer desde profile.specialty
        telefono: user.profile?.phone || '',
        email: user.email || '',
        direccion: ''
      });
    }
  }, [isExternalClient, user]);

  // Estados de precios (cargados desde la API)
  const [tomografiaPricing, setTomografiaPricing] = useState<Tomografia3DPricing>(DEFAULT_TOMOGRAFIA_PRICING);
  const [radiografiasPricing, setRadiografiasPricing] = useState<RadiografiasPricing>(DEFAULT_RADIOGRAFIAS_PRICING);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<PanoCefPriceBreakdownItem[]>([]);

  // Estados para detección de paciente MyDent
  const [searchingDni, setSearchingDni] = useState(false);
  const [isMyDentPatient, setIsMyDentPatient] = useState<boolean | null>(null); // null = no buscado, true = encontrado, false = externo
  const [foundPatientId, setFoundPatientId] = useState<number | null>(null);
  const [foundPatientBranch, setFoundPatientBranch] = useState<string | null>(null);

  // Estados para detección de doctor MyDent
  const [searchingCop, setSearchingCop] = useState(false);
  const [isMyDentDoctor, setIsMyDentDoctor] = useState<boolean | null>(null); // null = no buscado, true = encontrado, false = externo
  const [foundDentistId, setFoundDentistId] = useState<number | null>(null);
  const [foundDoctorBranch, setFoundDoctorBranch] = useState<string | null>(null);

  // Cargar precios desde la API
  useEffect(() => {
    const loadPrices = async () => {
      try {
        setLoadingPrices(true);
        const allPricing = await laboratoryServicePricesApi.getAllPricing();
        setTomografiaPricing(allPricing.tomografia3d);
        setRadiografiasPricing(allPricing.radiografias);
      } catch (err) {
        console.error('Error al cargar precios:', err);
        toast.error('Error al cargar precios. Usando valores por defecto.');
      } finally {
        setLoadingPrices(false);
      }
    };

    loadPrices();
  }, []);

  // Calcular precio basado en selecciones
  const calculatePrice = useCallback(() => {
    const breakdown: PanoCefPriceBreakdownItem[] = [];
    let total = 0;

    // === TOMOGRAFÍA 3D ===
    // Tipo de entrega
    if (tomografiaData.conInforme) {
      const price = tomografiaPricing.conInforme || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'entrega',
        itemName: 'Con Informe',
        itemKey: 'conInforme',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.sinInforme) {
      const price = tomografiaPricing.sinInforme || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'entrega',
        itemName: 'Sin Informe',
        itemKey: 'sinInforme',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.dicom) {
      const price = tomografiaPricing.dicom || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'entrega',
        itemName: 'DICOM',
        itemKey: 'dicom',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.soloUsb) {
      const price = tomografiaPricing.soloUsb || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'entrega',
        itemName: 'Solo USB',
        itemKey: 'soloUsb',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Campo pequeño
    if (tomografiaData.endodoncia) {
      const qty = parseInt(tomografiaData.numeroPiezasEndo) || 1;
      const price = (tomografiaPricing.endodoncia || 0) * qty;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoPequeno',
        itemName: 'Endodoncia',
        itemKey: 'endodoncia',
        basePrice: tomografiaPricing.endodoncia || 0,
        quantity: qty,
        subtotal: price
      });
    }
    if (tomografiaData.fracturaRadicular) {
      const price = tomografiaPricing.fracturaRadicular || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoPequeno',
        itemName: 'Fractura Radicular',
        itemKey: 'fracturaRadicular',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.anatomiaEndodontica) {
      const price = tomografiaPricing.anatomiaEndodontica || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoPequeno',
        itemName: 'Anatomía Endodóntica',
        itemKey: 'anatomiaEndodontica',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Campo mediano
    if (tomografiaData.localizacionDiente) {
      const price = tomografiaPricing.localizacionDiente || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoMediano',
        itemName: 'Localización de Diente',
        itemKey: 'localizacionDiente',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.implantes) {
      const qty = parseInt(tomografiaData.numeroCortes) || 1;
      const price = (tomografiaPricing.implantes || 0) * qty;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoMediano',
        itemName: 'Implantes',
        itemKey: 'implantes',
        basePrice: tomografiaPricing.implantes || 0,
        quantity: qty,
        subtotal: price
      });
    }
    if (tomografiaData.maxilarSuperior) {
      const price = tomografiaPricing.maxilarSuperior || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoMediano',
        itemName: 'Maxilar Superior',
        itemKey: 'maxilarSuperior',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Campo mediano/grande
    if (tomografiaData.viaAerea) {
      const price = tomografiaPricing.viaAerea || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoGrande',
        itemName: 'Vía Aérea',
        itemKey: 'viaAerea',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.ortognatica) {
      const price = tomografiaPricing.ortognatica || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'campoGrande',
        itemName: 'Ortognática',
        itemKey: 'ortognatica',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Ortodoncia
    if (tomografiaData.marpe) {
      const price = tomografiaPricing.marpe || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'ortodoncia',
        itemName: 'MARPE',
        itemKey: 'marpe',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.miniImplantes) {
      const price = tomografiaPricing.miniImplantes || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'ortodoncia',
        itemName: 'Mini-implantes',
        itemKey: 'miniImplantes',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Otras opciones
    if (tomografiaData.atm) {
      const price = tomografiaPricing.atm || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'otras',
        itemName: 'ATM',
        itemKey: 'atm',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (tomografiaData.macizoFacial) {
      const price = tomografiaPricing.macizoFacial || 0;
      total += price;
      breakdown.push({
        category: 'tomografia3D',
        subcategory: 'otras',
        itemName: 'Macizo Facial',
        itemKey: 'macizoFacial',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // === RADIOGRAFÍAS ===
    // Intraorales - Periapical
    // Usar periapicalFisico directamente (array de dientes seleccionados)
    const numPeriapicalFisico = (radiografiasData.periapicalFisico || []).length;
    if (numPeriapicalFisico > 0) {
      const price = (radiografiasPricing.periapicalFisico || 0) * numPeriapicalFisico;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'periapical',
        itemName: 'Periapical Físico',
        itemKey: 'periapicalFisico',
        basePrice: radiografiasPricing.periapicalFisico || 0,
        quantity: numPeriapicalFisico,
        subtotal: price
      });
    }

    // Usar periapicalDigital directamente (array de dientes seleccionados)
    const numPeriapicalDigital = (radiografiasData.periapicalDigital || []).length;
    if (numPeriapicalDigital > 0) {
      const price = (radiografiasPricing.periapicalDigital || 0) * numPeriapicalDigital;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'periapical',
        itemName: 'Periapical Digital',
        itemKey: 'periapicalDigital',
        basePrice: radiografiasPricing.periapicalDigital || 0,
        quantity: numPeriapicalDigital,
        subtotal: price
      });
    }

    // Bitewing
    const bitewingCount = (radiografiasData.bitewingMolaresDerecha ? 1 : 0) +
                          (radiografiasData.bitewingMolaresIzquierda ? 1 : 0) +
                          (radiografiasData.bitewingPremolaresDerecha ? 1 : 0) +
                          (radiografiasData.bitewingPremolaresIzquierda ? 1 : 0);
    if (bitewingCount > 0) {
      // Determinar si es ambos o individual
      if (bitewingCount >= 2) {
        const price = radiografiasPricing.bitewingAmbos || 0;
        total += price;
        breakdown.push({
          category: 'intraoral',
          subcategory: 'bitewing',
          itemName: 'Bitewing (Ambos)',
          itemKey: 'bitewingAmbos',
          basePrice: price,
          quantity: 1,
          subtotal: price
        });
      } else {
        const price = (radiografiasData.bitewingMolaresDerecha || radiografiasData.bitewingPremolaresDerecha)
          ? radiografiasPricing.bitewingDerecho || 0
          : radiografiasPricing.bitewingIzquierdo || 0;
        total += price;
        breakdown.push({
          category: 'intraoral',
          subcategory: 'bitewing',
          itemName: 'Bitewing (Individual)',
          itemKey: 'bitewingIndividual',
          basePrice: price,
          quantity: 1,
          subtotal: price
        });
      }
    }

    // Oclusal
    if (radiografiasData.oclusalSuperiores) {
      const price = radiografiasPricing.oclusalSuperiores || 0;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'oclusal',
        itemName: 'Oclusal Superiores',
        itemKey: 'oclusalSuperiores',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.oclusalInferiores) {
      const price = radiografiasPricing.oclusalInferiores || 0;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'oclusal',
        itemName: 'Oclusal Inferiores',
        itemKey: 'oclusalInferiores',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Seriada
    if (radiografiasData.seriada) {
      const price = radiografiasPricing.seriada || 0;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'otras',
        itemName: 'Seriada',
        itemKey: 'seriada',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Fotografías
    if (radiografiasData.fotografias) {
      const price = radiografiasPricing.radiografias || 50;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'fotografias',
        itemName: 'Fotografías',
        itemKey: 'fotografias',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.fotografiaIntraoral) {
      const price = radiografiasPricing.fotografiaIntraoral || 30;
      total += price;
      breakdown.push({
        category: 'intraoral',
        subcategory: 'fotografias',
        itemName: 'Fotografía Intraoral',
        itemKey: 'fotografiaIntraoral',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.fotografiaExtraoral) {
      const price = radiografiasPricing.fotografiaExtraoral || 30;
      total += price;
      breakdown.push({
        category: 'extraoral',
        subcategory: 'fotografias',
        itemName: 'Fotografía Extraoral',
        itemKey: 'fotografiaExtraoral',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Extraorales
    if (radiografiasData.extraoralPanoramica) {
      const price = radiografiasPricing.halografiaPanoramica || 0;
      total += price;
      breakdown.push({
        category: 'extraoral',
        itemName: 'Panorámica',
        itemKey: 'panoramica',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.extraoralCefalometrica) {
      const price = radiografiasPricing.radiografiaCefalometrica || 0;
      total += price;
      breakdown.push({
        category: 'extraoral',
        itemName: 'Cefalométrica',
        itemKey: 'cefalometrica',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.extraoralCarpal) {
      const price = radiografiasPricing.halografiaLateral || 0;
      total += price;
      breakdown.push({
        category: 'extraoral',
        itemName: 'Carpal',
        itemKey: 'carpal',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.extraoralPosteriorAnterior) {
      const price = radiografiasPricing.halografiaPosterior || 0;
      total += price;
      breakdown.push({
        category: 'extraoral',
        itemName: 'Posterior-Anterior',
        itemKey: 'posteriorAnterior',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.extraoralAtmAbierta || radiografiasData.extraoralAtmCerrada) {
      const price = radiografiasPricing.estudiosAtm || 0;
      total += price;
      breakdown.push({
        category: 'extraoral',
        itemName: 'Estudios ATM',
        itemKey: 'estudiosAtm',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Asesoría Ortodoncia
    if (radiografiasData.ortodonciaPaquete > 0) {
      const paquete = radiografiasData.ortodonciaPaquete;
      const conAsesoria = radiografiasData.ortodonciaPlanTratamiento === 'con';
      let price = 0;
      let itemName = '';
      let itemKey = '';

      if (paquete === 1) {
        price = conAsesoria ? radiografiasPricing.paq1ConAsesoria : radiografiasPricing.paq1SinAsesoria;
        itemKey = conAsesoria ? 'paq1ConAsesoria' : 'paq1SinAsesoria';
        itemName = `Paquete 1 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      } else if (paquete === 2) {
        price = conAsesoria ? radiografiasPricing.paq2ConAsesoria : radiografiasPricing.paq2SinAsesoria;
        itemKey = conAsesoria ? 'paq2ConAsesoria' : 'paq2SinAsesoria';
        itemName = `Paquete 2 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      } else if (paquete === 3) {
        price = conAsesoria ? radiografiasPricing.paq3ConAsesoria : radiografiasPricing.paq3SinAsesoria;
        itemKey = conAsesoria ? 'paq3ConAsesoria' : 'paq3SinAsesoria';
        itemName = `Paquete 3 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      }

      total += price || 0;
      breakdown.push({
        category: 'ortodoncias',
        itemName,
        itemKey,
        basePrice: price || 0,
        quantity: 1,
        subtotal: price || 0
      });
    }

    // Servicios adicionales
    if (radiografiasData.ortodonciaAlineadores) {
      const price = radiografiasPricing.alteracionesInmediatas || 0;
      total += price;
      breakdown.push({
        category: 'ortodoncias',
        subcategory: 'adicionales',
        itemName: 'Alineadores Invisibles',
        itemKey: 'alineadores',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.ortodonciaEscaneo) {
      const price = radiografiasPricing.escaneoImpresionDigital || 0;
      total += price;
      breakdown.push({
        category: 'ortodoncias',
        subcategory: 'adicionales',
        itemName: 'Escaneo Intraoral Digital',
        itemKey: 'escaneoDigital',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.ortodonciaImpresion) {
      const price = radiografiasPricing.modelosEstudio3d || 0;
      total += price;
      breakdown.push({
        category: 'ortodoncias',
        subcategory: 'adicionales',
        itemName: 'Modelos de Estudio 3D',
        itemKey: 'modelos3d',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    // Análisis Cefalométricos
    if (radiografiasData.analisisRicketts) {
      const price = radiografiasPricing.ricketts || 0;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Ricketts',
        itemKey: 'ricketts',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisSteiner) {
      const price = radiografiasPricing.steiner || 0;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Steiner',
        itemKey: 'steiner',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisMcNamara) {
      const price = radiografiasPricing.mcNamara || 0;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis McNamara',
        itemKey: 'mcNamara',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisBjorks) {
      const price = radiografiasPricing.bjork || 0;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Bjork',
        itemKey: 'bjork',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisUSP) {
      const price = radiografiasPricing.usp || 0;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis USP',
        itemKey: 'usp',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    // Análisis Cefalométricos adicionales
    if (radiografiasData.analisisSchwartz) {
      const price = radiografiasPricing.schwartz || 50;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Schwartz',
        itemKey: 'schwartz',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisTweed) {
      const price = radiografiasPricing.tweed || 50;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Tweed',
        itemKey: 'tweed',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisDowns) {
      const price = radiografiasPricing.downs || 50;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Downs',
        itemKey: 'downs',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisRotJarabak) {
      const price = radiografiasPricing.rotJarabak || 50;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Rot Jarabak',
        itemKey: 'rotJarabak',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }
    if (radiografiasData.analisisTejidosBlancos) {
      const price = radiografiasPricing.tejidosBlancos || 50;
      total += price;
      breakdown.push({
        category: 'analisis',
        itemName: 'Análisis Tejidos Blandos',
        itemKey: 'tejidosBlancos',
        basePrice: price,
        quantity: 1,
        subtotal: price
      });
    }

    setCalculatedPrice(total);
    setPriceBreakdown(breakdown);
  }, [tomografiaData, radiografiasData, tomografiaPricing, radiografiasPricing]);

  // Recalcular precio cuando cambien los datos
  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  // Handlers de cambio
  const handleTomografiaChange = (field: keyof Tomografia3DFormData, value: any) => {
    setTomografiaData(prev => ({ ...prev, [field]: value }));
  };

  const handleRadiografiasChange = (field: keyof RadiografiasFormData, value: any) => {
    setRadiografiasData(prev => ({ ...prev, [field]: value }));
  };

  // Formatear DNI: solo números, máximo 8 dígitos
  const formatDNI = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.slice(0, 8);
  };

  // Buscar paciente por DNI cuando tenga 8 dígitos
  const searchPatientByDni = useCallback(async (dni: string) => {
    if (dni.length !== 8) {
      // Resetear estado si el DNI no tiene 8 dígitos
      if (isMyDentPatient !== null) {
        setIsMyDentPatient(null);
        setFoundPatientId(null);
        setFoundPatientBranch(null);
      }
      return;
    }

    try {
      setSearchingDni(true);
      const result = await patientsApi.searchByDni(dni);

      if (result.found && result.patient) {
        // Paciente encontrado en MyDent - autocompletar datos
        setIsMyDentPatient(true);
        setFoundPatientId(result.patient.patient_id);
        setFoundPatientBranch(result.patient.branch_name);

        // Autocompletar datos del paciente
        setPatientData(prev => ({
          ...prev,
          nombres: result.patient!.nombres,
          apellidos: result.patient!.apellidos,
          email: result.patient!.email || prev.email,
          telefono: result.patient!.telefono || prev.telefono,
          edad: result.patient!.edad || prev.edad
        }));

        toast.success('Paciente encontrado en MyDent');
      } else {
        // Paciente externo - permitir ingreso manual
        setIsMyDentPatient(false);
        setFoundPatientId(null);
        setFoundPatientBranch(null);
      }
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      setIsMyDentPatient(false);
      setFoundPatientId(null);
      setFoundPatientBranch(null);
    } finally {
      setSearchingDni(false);
    }
  }, [isMyDentPatient]);

  // Buscar doctor por COP cuando tenga al menos 3 caracteres
  const searchDoctorByCop = useCallback(async (cop: string) => {
    // Solo buscar si el COP tiene formato válido (ej: COP-12345 o solo números)
    const cleanCop = cop.replace(/\s/g, '');
    if (cleanCop.length < 3) {
      // Resetear estado si el COP es muy corto
      if (isMyDentDoctor !== null) {
        setIsMyDentDoctor(null);
        setFoundDentistId(null);
        setFoundDoctorBranch(null);
      }
      return;
    }

    try {
      setSearchingCop(true);
      const result = await dentistsApi.searchByCop(cleanCop);

      if (result.found && result.dentist) {
        // Doctor encontrado en MyDent - autocompletar datos
        setIsMyDentDoctor(true);
        setFoundDentistId(result.dentist.dentist_id);
        setFoundDoctorBranch(result.dentist.branch_name);

        // Autocompletar datos del doctor
        setDoctorData(prev => ({
          ...prev,
          nombres: result.dentist!.nombres,
          apellidos: result.dentist!.apellidos,
          email: result.dentist!.email || prev.email,
          telefono: result.dentist!.telefono || prev.telefono,
          especialidad: result.dentist!.especialidad || prev.especialidad
        }));

        toast.success('Odontólogo encontrado en MyDent');
      } else {
        // Doctor externo - permitir ingreso manual
        setIsMyDentDoctor(false);
        setFoundDentistId(null);
        setFoundDoctorBranch(null);
      }
    } catch (error) {
      console.error('Error al buscar doctor:', error);
      setIsMyDentDoctor(false);
      setFoundDentistId(null);
      setFoundDoctorBranch(null);
    } finally {
      setSearchingCop(false);
    }
  }, [isMyDentDoctor]);

  // Formatear teléfono: solo números, máximo 9 dígitos, formato XXX XXX XXX
  const formatPhone = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, '').slice(0, 9);

    if (onlyNumbers.length <= 3) {
      return onlyNumbers;
    } else if (onlyNumbers.length <= 6) {
      return `${onlyNumbers.slice(0, 3)} ${onlyNumbers.slice(3)}`;
    } else {
      return `${onlyNumbers.slice(0, 3)} ${onlyNumbers.slice(3, 6)} ${onlyNumbers.slice(6)}`;
    }
  };

  const handlePatientChange = (field: keyof PatientData, value: string) => {
    let formattedValue = value;

    // Aplicar validaciones específicas por campo
    if (field === 'dni') {
      formattedValue = formatDNI(value);

      // Buscar paciente cuando el DNI tenga 8 dígitos
      if (formattedValue.length === 8) {
        searchPatientByDni(formattedValue);
      } else if (formattedValue.length < 8 && isMyDentPatient !== null) {
        // Resetear si se borra parte del DNI
        setIsMyDentPatient(null);
        setFoundPatientId(null);
        setFoundPatientBranch(null);
      }
    } else if (field === 'telefono') {
      formattedValue = formatPhone(value);
    }

    setPatientData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleDoctorChange = (field: keyof DoctorData, value: string) => {
    let formattedValue = value;

    // Aplicar validación de teléfono
    if (field === 'telefono') {
      formattedValue = formatPhone(value);
    }

    // Buscar doctor por COP cuando se modifica (solo si no es external_client)
    if (field === 'cop' && !isExternalClient) {
      const cleanCop = value.replace(/\s/g, '');
      if (cleanCop.length >= 3) {
        searchDoctorByCop(cleanCop);
      } else if (cleanCop.length < 3 && isMyDentDoctor !== null) {
        // Resetear si se borra parte del COP
        setIsMyDentDoctor(null);
        setFoundDentistId(null);
        setFoundDoctorBranch(null);
      }
    }

    setDoctorData(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Determinar tipo de radiografía basado en selecciones
  const getRadiographyType = (): string => {
    const hasTomografia = Object.entries(tomografiaData).some(([key, value]) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string' && key !== 'otros') return value.length > 0;
      return false;
    });

    const hasRadiografias =
      radiografiasData.dientesSuperioresFisico.length > 0 ||
      radiografiasData.dientesInferioresFisico.length > 0 ||
      radiografiasData.dientesSuperioresDigital.length > 0 ||
      radiografiasData.dientesInferioresDigital.length > 0 ||
      radiografiasData.oclusalSuperiores ||
      radiografiasData.oclusalInferiores ||
      radiografiasData.seriada ||
      radiografiasData.extraoralPanoramica ||
      radiografiasData.extraoralCefalometrica ||
      radiografiasData.extraoralCarpal ||
      radiografiasData.ortodonciaPaquete > 0;

    if (hasTomografia && hasRadiografias) return 'Tomografía 3D + Radiografías';
    if (hasTomografia) return 'Tomografía 3D';
    if (hasRadiografias) return 'Radiografías';
    return 'Sin especificar';
  };

  // Validar formulario
  const validateForm = (): boolean => {
    // Validar datos del paciente
    if (!patientData.nombres.trim()) {
      setError('Por favor, ingrese el nombre del paciente');
      return false;
    }
    if (!patientData.apellidos.trim()) {
      setError('Por favor, ingrese los apellidos del paciente');
      return false;
    }
    if (!patientData.dni.trim()) {
      setError('Por favor, ingrese el DNI del paciente');
      return false;
    }
    // Validar que el DNI tenga exactamente 8 dígitos
    if (patientData.dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos');
      return false;
    }

    // Validar que haya al menos un estudio seleccionado
    if (priceBreakdown.length === 0) {
      setError('Por favor, seleccione al menos un estudio');
      return false;
    }

    setError(null);
    return true;
  };

  // Guardar solicitud
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Preparar datos de la solicitud
      // Para external_client, asignar su dentist_id para que pueda ver sus solicitudes
      // Si es paciente MyDent, vincular con patient_id
      // Si es doctor MyDent (no external_client), vincular con dentist_id encontrado
      const requestData = {
        patient_id: foundPatientId || undefined, // Vincular si es paciente MyDent
        dentist_id: isExternalClient ? user?.dentist_id : (foundDentistId || undefined), // Asignar dentist_id
        branch_id: 1, // Sede por defecto
        request_date: formatDateToYMD(new Date()),
        radiography_type: getRadiographyType(),
        area_of_interest: tomografiaData.otros || undefined,
        clinical_indication: patientData.motivoConsulta || undefined,
        urgency: 'normal' as const,
        request_status: 'pending',
        request_data: {
          patient: {
            dni: patientData.dni,
            nombres: patientData.nombres,
            apellidos: patientData.apellidos,
            telefono: patientData.telefono,
            edad: patientData.edad ? parseInt(patientData.edad) : undefined,
            email: patientData.email,
            motivoConsulta: patientData.motivoConsulta
          },
          doctor: {
            nombre: `${doctorData.nombres} ${doctorData.apellidos}`.trim(),
            especialidad: doctorData.especialidad,
            colegiatura: doctorData.cop,
            telefono: doctorData.telefono,
            email: doctorData.email,
            direccion: doctorData.direccion
          },
          tomografia3D: tomografiaData,
          radiografias: radiografiasData
        },
        pricing_data: {
          breakdown: priceBreakdown,
          suggestedPrice: calculatedPrice,
          finalPrice: calculatedPrice,
          status: 'pending' as const
        },
        user_id_registration: user?.id
      };

      await radiographyApi.createRadiographyRequest(requestData);

      toast.success('Solicitud creada exitosamente');
      // Redirigir a submissions para external_client, a requests para staff interno
      navigate(isExternalClient ? '/laboratory/submissions' : '/laboratory/requests');
    } catch (err: any) {
      console.error('Error al crear solicitud:', err);
      setError(err.message || 'Error al crear la solicitud');
      toast.error('Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Redirigir a submissions para external_client, a requests para staff interno
    navigate(isExternalClient ? '/laboratory/submissions' : '/laboratory/requests');
  };

  if (loadingPrices) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panocef-primary"></div>
        <span className="ml-2 text-gray-600">Cargando precios...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-panocef-light rounded-lg flex items-center justify-center">
                <PlusCircle className="w-6 h-6 text-panocef-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud</h1>
                <p className="text-gray-600">Crear solicitud de Tomografía/Radiografía</p>
              </div>
            </div>
          </div>

          {/* Precio calculado */}
          <div className="bg-panocef-light rounded-xl p-4 border border-panocef-secondary">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-panocef-primary" />
              <div>
                <p className="text-sm text-panocef-primary font-medium">Precio Estimado</p>
                <p className="text-2xl font-bold text-panocef-dark">
                  S/ {calculatedPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Sección de Datos del Paciente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-panocef-light rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-panocef-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos del Paciente</h2>
              <p className="text-sm text-gray-500">Ingrese el DNI para buscar automáticamente</p>
            </div>
          </div>

          {/* Badge de estado del paciente */}
          {isMyDentPatient === true && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Paciente MyDent</span>
              {foundPatientBranch && (
                <span className="text-xs text-green-600">({foundPatientBranch})</span>
              )}
            </div>
          )}
          {isMyDentPatient === false && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
              <UserX className="w-4 h-4" />
              <span className="text-sm font-medium">Paciente Externo</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Campo DNI con búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={patientData.dni}
                onChange={(e) => handlePatientChange('dni', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="8 dígitos"
                maxLength={8}
                inputMode="numeric"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {searchingDni ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-panocef-primary"></div>
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            {patientData.dni.length > 0 && patientData.dni.length < 8 && (
              <p className="text-xs text-gray-500 mt-1">
                {8 - patientData.dni.length} dígitos restantes
              </p>
            )}
          </div>

          {/* Nombres - readonly si es paciente MyDent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombres <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientData.nombres}
              onChange={(e) => handlePatientChange('nombres', e.target.value)}
              readOnly={isMyDentPatient === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isMyDentPatient === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Nombres del paciente"
            />
          </div>

          {/* Apellidos - readonly si es paciente MyDent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientData.apellidos}
              onChange={(e) => handlePatientChange('apellidos', e.target.value)}
              readOnly={isMyDentPatient === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isMyDentPatient === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Apellidos del paciente"
            />
          </div>

          {/* Edad - readonly si es paciente MyDent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edad
            </label>
            <input
              type="text"
              value={patientData.edad}
              onChange={(e) => handlePatientChange('edad', e.target.value)}
              readOnly={isMyDentPatient === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isMyDentPatient === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Edad"
              maxLength={3}
            />
          </div>

          {/* Teléfono - readonly si es paciente MyDent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={patientData.telefono}
              onChange={(e) => handlePatientChange('telefono', e.target.value)}
              readOnly={isMyDentPatient === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isMyDentPatient === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="999 999 999"
              maxLength={11}
              inputMode="numeric"
            />
          </div>

          {/* Email - readonly si es paciente MyDent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={patientData.email}
              onChange={(e) => handlePatientChange('email', e.target.value)}
              readOnly={isMyDentPatient === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isMyDentPatient === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Correo electrónico"
            />
          </div>
        </div>

        {/* Info adicional si es paciente MyDent */}
        {isMyDentPatient === true && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Los datos fueron cargados automáticamente. Esta solicitud quedará vinculada al historial del paciente.
            </p>
          </div>
        )}
      </div>

      {/* Sección de Datos del Doctor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-panocef-light rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-panocef-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Datos del Odontólogo</h2>
              <p className="text-sm text-gray-500">
                {isExternalClient
                  ? 'Tus datos de perfil (se completan automáticamente)'
                  : 'Ingrese el COP para buscar automáticamente'}
              </p>
            </div>
          </div>

          {/* Badge de estado del doctor */}
          {isExternalClient ? (
            <span className="px-3 py-1 bg-panocef-light text-panocef-primary text-xs font-medium rounded-full">
              Datos de tu perfil
            </span>
          ) : isMyDentDoctor === true ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Odontólogo MyDent</span>
              {foundDoctorBranch && (
                <span className="text-xs text-green-600">({foundDoctorBranch})</span>
              )}
            </div>
          ) : isMyDentDoctor === false ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
              <UserX className="w-4 h-4" />
              <span className="text-sm font-medium">Odontólogo Externo</span>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Campo COP con búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              COP (Colegiatura)
            </label>
            <div className="relative">
              <input
                type="text"
                value={doctorData.cop}
                onChange={(e) => handleDoctorChange('cop', e.target.value)}
                readOnly={isExternalClient}
                className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                  isExternalClient
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
                }`}
                placeholder="Ej: 12345"
              />
              {!isExternalClient && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {searchingCop ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-panocef-primary"></div>
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            {!isExternalClient && doctorData.cop.length > 0 && doctorData.cop.length < 3 && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 3 caracteres para buscar
              </p>
            )}
          </div>

          {/* Nombres - readonly si es doctor MyDent o external_client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombres
            </label>
            <input
              type="text"
              value={doctorData.nombres}
              onChange={(e) => handleDoctorChange('nombres', e.target.value)}
              readOnly={isExternalClient || isMyDentDoctor === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isExternalClient || isMyDentDoctor === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Nombres del doctor"
            />
          </div>

          {/* Apellidos - readonly si es doctor MyDent o external_client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos
            </label>
            <input
              type="text"
              value={doctorData.apellidos}
              onChange={(e) => handleDoctorChange('apellidos', e.target.value)}
              readOnly={isExternalClient || isMyDentDoctor === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isExternalClient || isMyDentDoctor === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Apellidos del doctor"
            />
          </div>

          {/* Especialidad - readonly si es doctor MyDent o external_client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <input
              type="text"
              value={doctorData.especialidad}
              onChange={(e) => handleDoctorChange('especialidad', e.target.value)}
              readOnly={isExternalClient || isMyDentDoctor === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isExternalClient || isMyDentDoctor === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Especialidad médica"
            />
          </div>

          {/* Teléfono - readonly si es doctor MyDent o external_client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={doctorData.telefono}
              onChange={(e) => handleDoctorChange('telefono', e.target.value)}
              readOnly={isExternalClient || isMyDentDoctor === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isExternalClient || isMyDentDoctor === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="999 999 999"
              maxLength={11}
              inputMode="numeric"
            />
          </div>

          {/* Email - readonly si es doctor MyDent o external_client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={doctorData.email}
              onChange={(e) => handleDoctorChange('email', e.target.value)}
              readOnly={isExternalClient || isMyDentDoctor === true}
              className={`w-full px-3 py-2 border rounded-lg ${
                isExternalClient || isMyDentDoctor === true
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary'
              }`}
              placeholder="Correo electrónico"
            />
          </div>
        </div>

        {/* Info adicional si es doctor MyDent */}
        {isMyDentDoctor === true && !isExternalClient && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Odontólogo encontrado en el sistema. Los datos fueron cargados automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Formulario de Estudios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-panocef-light rounded-lg flex items-center justify-center">
            <FileImage className="w-5 h-5 text-panocef-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Estudios Solicitados</h2>
            <p className="text-sm text-gray-500">Seleccione los estudios de Tomografía y/o Radiografías</p>
          </div>
        </div>

        <LaboratoryFormUnified
          mode="edit"
          userRole="imaging_technician"
          showPrices={true}
          colorTheme="panocef"
          tomografiaData={tomografiaData}
          radiografiasData={radiografiasData}
          tomografiaPricing={tomografiaPricing}
          radiografiasPricing={radiografiasPricing}
          onTomografiaChange={handleTomografiaChange}
          onRadiografiasChange={handleRadiografiasChange}
          loading={loading}
          error={error}
        />
      </div>

      {/* Resumen de Precios */}
      {priceBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Desglose de Precios</h2>
              <p className="text-sm text-gray-500">{priceBreakdown.length} items seleccionados</p>
            </div>
          </div>

          <div className="space-y-2">
            {priceBreakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    item.category === 'tomografia3D' ? 'bg-panocef-light text-panocef-primary' :
                    item.category === 'intraoral' ? 'bg-blue-100 text-blue-700' :
                    item.category === 'extraoral' ? 'bg-panocef-light text-panocef-primary' :
                    item.category === 'ortodoncias' ? 'bg-panocef-light text-panocef-primary' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {item.category === 'tomografia3D' ? 'Tomografía' :
                     item.category === 'intraoral' ? 'Intraoral' :
                     item.category === 'extraoral' ? 'Extraoral' :
                     item.category === 'ortodoncias' ? 'Ortodoncia' :
                     'Análisis'}
                  </span>
                  <span className="text-gray-900 font-medium">{item.itemName}</span>
                  {item.quantity > 1 && (
                    <span className="text-gray-500 text-sm">x{item.quantity}</span>
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  S/ {item.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}

            <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-panocef-primary">
                S/ {calculatedPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || priceBreakdown.length === 0}
            className="px-6 py-2.5 bg-panocef-primary text-white rounded-lg hover:bg-panocef-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Crear Solicitud
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NewRequestPage;
