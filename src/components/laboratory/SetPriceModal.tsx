import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyRequestsApi } from '@/services/api/radiographyRequestsApi';
import { radiographyApi } from '@/services/api/radiographyApi';
import { useAuth } from '@/hooks/useAuth';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';
import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';

interface SetPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  patientName: string;
  currentPricing?: {
    breakdown?: Array<{
      category: string;
      itemName: string;
      itemKey: string;
      basePrice: number;
      quantity?: number;
      subtotal: number;
    }>;
    suggestedPrice?: number;
    finalPrice?: number;
    notes?: string;
  };
}

interface EditableBreakdownItem {
  category: string;
  itemName: string;
  itemKey: string;
  price: number; // Precio editable
  quantity?: number;
}

export const SetPriceModal = ({
  isOpen,
  onClose,
  requestId,
  patientName,
  currentPricing,
  onSuccess
}: SetPriceModalProps) => {
  const { user } = useAuth();
  const { pricing: radiografiasPricing } = useRadiografiasPricing();
  const { pricing: tomografiaPricing } = useTomografia3DPricing();
  const [breakdownItems, setBreakdownItems] = useState<EditableBreakdownItem[]>([]);
  const [notes, setNotes] = useState(currentPricing?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Función para normalizar items de breakdown (soporta formato antiguo y nuevo)
  const normalizeBreakdownItem = (item: any): EditableBreakdownItem => {
    // Formato nuevo: tiene itemName, category, itemKey, basePrice
    if (item.itemName) {
      return {
        category: item.category || 'general',
        itemName: item.itemName,
        itemKey: item.itemKey || item.itemName.toLowerCase().replace(/\s+/g, '_'),
        price: item.basePrice ?? item.price ?? 0,
        quantity: item.quantity
      };
    }
    // Formato antiguo: tiene service y price
    return {
      category: inferCategoryFromService(item.service || 'Servicio'),
      itemName: item.service || 'Servicio sin nombre',
      itemKey: (item.service || 'servicio').toLowerCase().replace(/\s+/g, '_'),
      price: item.price ?? 0,
      quantity: item.quantity || 1
    };
  };

  // Inferir categoría basándose en el nombre del servicio (formato antiguo)
  const inferCategoryFromService = (service: string): string => {
    const s = service.toLowerCase();
    if (s.includes('tomografía') || s.includes('tomografia') || s.includes('usb') || s.includes('dicom') ||
        s.includes('informe') || s.includes('atm') || s.includes('macizo') || s.includes('marpe') ||
        s.includes('implante') || s.includes('endodoncia') || s.includes('vía aérea') || s.includes('ortognática')) {
      return 'tomografia';
    }
    if (s.includes('fotografía') || s.includes('fotografia') || s.includes('foto')) {
      return 'fotografias';
    }
    if (s.includes('periapical') || s.includes('bitewing') || s.includes('oclusal') || s.includes('seriada')) {
      return 'intraoral';
    }
    if (s.includes('panorámica') || s.includes('panoramica') || s.includes('cefalométrica') || s.includes('cefalometrica') ||
        s.includes('carpal') || s.includes('posterior')) {
      return 'extraoral';
    }
    if (s.includes('paquete') || s.includes('ortodoncia') || s.includes('asesoría') || s.includes('asesoria')) {
      return 'ortodoncias';
    }
    if (s.includes('análisis') || s.includes('analisis') || s.includes('ricketts') || s.includes('steiner') ||
        s.includes('mcnamara') || s.includes('bjork') || s.includes('usp') || s.includes('schwartz') ||
        s.includes('tweed') || s.includes('downs') || s.includes('jarabak') || s.includes('tejidos')) {
      return 'analisis';
    }
    return 'general';
  };

  // Cargar breakdown cuando se abre el modal
  // Siempre cargamos desde la API para tener acceso a request_data y generar items faltantes
  useEffect(() => {
    if (isOpen) {
      loadRequestBreakdown();
    }
  }, [isOpen, requestId, radiografiasPricing, tomografiaPricing]);

  // Generar items adicionales desde request_data que no están en el breakdown
  const generateItemsFromRequestData = (requestData: any, existingKeys: Set<string>): EditableBreakdownItem[] => {
    const additionalItems: EditableBreakdownItem[] = [];
    const tomografia3D = requestData?.tomografia3D || {};
    const radiografias = requestData?.radiografias || {};

    // === TOMOGRAFÍA 3D ===
    const tomografiaFields = [
      { field: 'conInforme', name: 'Con Informe', priceKey: 'conInforme' },
      { field: 'sinInforme', name: 'Sin Informe', priceKey: 'sinInforme' },
      { field: 'dicom', name: 'DICOM', priceKey: 'dicom' },
      { field: 'soloUsb', name: 'Solo USB', priceKey: 'soloUsb' },
      { field: 'endodoncia', name: 'Endodoncia', priceKey: 'endodoncia' },
      { field: 'fracturaRadicular', name: 'Fractura Radicular', priceKey: 'fracturaRadicular' },
      { field: 'anatomiaEndodontica', name: 'Anatomía Endodóntica', priceKey: 'anatomiaEndodontica' },
      { field: 'localizacionDiente', name: 'Localización de Diente', priceKey: 'localizacionDiente' },
      { field: 'implantes', name: 'Implantes', priceKey: 'implantes' },
      { field: 'maxilarSuperior', name: 'Maxilar Superior', priceKey: 'maxilarSuperior' },
      { field: 'viaAerea', name: 'Vía Aérea', priceKey: 'viaAerea' },
      { field: 'ortognatica', name: 'Ortognática', priceKey: 'ortognatica' },
      { field: 'marpe', name: 'MARPE', priceKey: 'marpe' },
      { field: 'miniImplantes', name: 'Mini-implantes', priceKey: 'miniImplantes' },
      { field: 'atm', name: 'ATM', priceKey: 'atm' },
      { field: 'macizoFacial', name: 'Macizo Facial', priceKey: 'macizoFacial' },
    ];

    for (const { field, name, priceKey } of tomografiaFields) {
      if (tomografia3D[field] === true && !existingKeys.has(field)) {
        additionalItems.push({
          category: 'tomografia3D',
          itemName: name,
          itemKey: field,
          price: (tomografiaPricing as any)?.[priceKey] || 0,
          quantity: 1
        });
      }
    }

    // === RADIOGRAFÍAS INTRAORALES ===
    // Periapicales
    const periapicalFisico = radiografias.periapicalFisico || [];
    if (periapicalFisico.length > 0 && !existingKeys.has('periapicalFisico')) {
      additionalItems.push({
        category: 'intraoral',
        itemName: 'Periapical Físico',
        itemKey: 'periapicalFisico',
        price: radiografiasPricing?.periapicalFisico || 0,
        quantity: periapicalFisico.length
      });
    }
    const periapicalDigital = radiografias.periapicalDigital || [];
    if (periapicalDigital.length > 0 && !existingKeys.has('periapicalDigital')) {
      additionalItems.push({
        category: 'intraoral',
        itemName: 'Periapical Digital',
        itemKey: 'periapicalDigital',
        price: radiografiasPricing?.periapicalDigital || 0,
        quantity: periapicalDigital.length
      });
    }

    // Bitewing
    const bitewingCount = (radiografias.bitewingMolaresDerecha ? 1 : 0) +
                          (radiografias.bitewingMolaresIzquierda ? 1 : 0) +
                          (radiografias.bitewingPremolaresDerecha ? 1 : 0) +
                          (radiografias.bitewingPremolaresIzquierda ? 1 : 0);
    if (bitewingCount > 0 && !existingKeys.has('bitewingAmbos') && !existingKeys.has('bitewingIndividual')) {
      if (bitewingCount >= 2) {
        additionalItems.push({
          category: 'intraoral',
          itemName: 'Bitewing (Ambos)',
          itemKey: 'bitewingAmbos',
          price: radiografiasPricing?.bitewingAmbos || 0,
          quantity: 1
        });
      } else {
        additionalItems.push({
          category: 'intraoral',
          itemName: 'Bitewing (Individual)',
          itemKey: 'bitewingIndividual',
          price: radiografiasPricing?.bitewingDerecho || radiografiasPricing?.bitewingIzquierdo || 0,
          quantity: 1
        });
      }
    }

    // Oclusales y Seriada
    const intraoralFields = [
      { field: 'oclusalSuperiores', name: 'Oclusal Superiores', priceKey: 'oclusalSuperiores' },
      { field: 'oclusalInferiores', name: 'Oclusal Inferiores', priceKey: 'oclusalInferiores' },
      { field: 'seriada', name: 'Seriada', priceKey: 'seriada' },
    ];
    for (const { field, name, priceKey } of intraoralFields) {
      if (radiografias[field] === true && !existingKeys.has(field)) {
        additionalItems.push({
          category: 'intraoral',
          itemName: name,
          itemKey: field,
          price: (radiografiasPricing as any)?.[priceKey] || 0,
          quantity: 1
        });
      }
    }

    // Fotografías
    if (radiografias.fotografias === true && !existingKeys.has('fotografias')) {
      additionalItems.push({
        category: 'fotografias',
        itemName: 'Fotografías',
        itemKey: 'fotografias',
        price: radiografiasPricing?.radiografias || 50,
        quantity: 1
      });
    }
    if (radiografias.fotografiaIntraoral === true && !existingKeys.has('fotografiaIntraoral')) {
      additionalItems.push({
        category: 'fotografias',
        itemName: 'Fotografía Intraoral',
        itemKey: 'fotografiaIntraoral',
        price: radiografiasPricing?.fotografiaIntraoral || 30,
        quantity: 1
      });
    }
    if (radiografias.fotografiaExtraoral === true && !existingKeys.has('fotografiaExtraoral')) {
      additionalItems.push({
        category: 'fotografias',
        itemName: 'Fotografía Extraoral',
        itemKey: 'fotografiaExtraoral',
        price: radiografiasPricing?.fotografiaExtraoral || 30,
        quantity: 1
      });
    }

    // === EXTRAORALES ===
    const extraoralFields = [
      { field: 'extraoralPanoramica', name: 'Panorámica', priceKey: 'halografiaPanoramica' },
      { field: 'extraoralCefalometrica', name: 'Cefalométrica', priceKey: 'radiografiaCefalometrica' },
      { field: 'extraoralCarpal', name: 'Carpal', priceKey: 'halografiaLateral' },
      { field: 'extraoralPosteriorAnterior', name: 'Posterior-Anterior', priceKey: 'halografiaPosterior' },
    ];
    for (const { field, name, priceKey } of extraoralFields) {
      if (radiografias[field] === true && !existingKeys.has(field.replace('extraoral', '').toLowerCase())) {
        additionalItems.push({
          category: 'extraoral',
          itemName: name,
          itemKey: field.replace('extraoral', '').toLowerCase() || field,
          price: (radiografiasPricing as any)?.[priceKey] || 0,
          quantity: 1
        });
      }
    }
    // ATM
    if ((radiografias.extraoralAtmAbierta === true || radiografias.extraoralAtmCerrada === true) && !existingKeys.has('estudiosAtm')) {
      additionalItems.push({
        category: 'extraoral',
        itemName: 'Estudios ATM',
        itemKey: 'estudiosAtm',
        price: radiografiasPricing?.estudiosAtm || 0,
        quantity: 1
      });
    }

    // === ORTODONCIA ===
    if (radiografias.ortodonciaPaquete > 0 && !existingKeys.has('paq1ConAsesoria') && !existingKeys.has('paq1SinAsesoria') &&
        !existingKeys.has('paq2ConAsesoria') && !existingKeys.has('paq2SinAsesoria') &&
        !existingKeys.has('paq3ConAsesoria') && !existingKeys.has('paq3SinAsesoria')) {
      const paquete = radiografias.ortodonciaPaquete;
      const conAsesoria = radiografias.ortodonciaPlanTratamiento === 'con';
      let price = 0;
      let itemName = '';
      let itemKey = '';
      if (paquete === 1) {
        price = conAsesoria ? radiografiasPricing?.paq1ConAsesoria : radiografiasPricing?.paq1SinAsesoria;
        itemKey = conAsesoria ? 'paq1ConAsesoria' : 'paq1SinAsesoria';
        itemName = `Paquete 1 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      } else if (paquete === 2) {
        price = conAsesoria ? radiografiasPricing?.paq2ConAsesoria : radiografiasPricing?.paq2SinAsesoria;
        itemKey = conAsesoria ? 'paq2ConAsesoria' : 'paq2SinAsesoria';
        itemName = `Paquete 2 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      } else if (paquete === 3) {
        price = conAsesoria ? radiografiasPricing?.paq3ConAsesoria : radiografiasPricing?.paq3SinAsesoria;
        itemKey = conAsesoria ? 'paq3ConAsesoria' : 'paq3SinAsesoria';
        itemName = `Paquete 3 ${conAsesoria ? 'con' : 'sin'} Asesoría`;
      }
      if (itemKey) {
        additionalItems.push({
          category: 'ortodoncias',
          itemName,
          itemKey,
          price: price || 0,
          quantity: 1
        });
      }
    }

    // Servicios adicionales ortodoncia
    if (radiografias.ortodonciaAlineadores === true && !existingKeys.has('alineadores')) {
      additionalItems.push({
        category: 'ortodoncias',
        itemName: 'Alineadores Invisibles',
        itemKey: 'alineadores',
        price: radiografiasPricing?.alteracionesInmediatas || 0,
        quantity: 1
      });
    }
    if (radiografias.ortodonciaEscaneo === true && !existingKeys.has('escaneoDigital')) {
      additionalItems.push({
        category: 'ortodoncias',
        itemName: 'Escaneo Intraoral Digital',
        itemKey: 'escaneoDigital',
        price: radiografiasPricing?.escaneoImpresionDigital || 0,
        quantity: 1
      });
    }
    if (radiografias.ortodonciaImpresion === true && !existingKeys.has('modelos3d')) {
      additionalItems.push({
        category: 'ortodoncias',
        itemName: 'Modelos de Estudio 3D',
        itemKey: 'modelos3d',
        price: radiografiasPricing?.modelosEstudio3d || 0,
        quantity: 1
      });
    }

    // === ANÁLISIS CEFALOMÉTRICOS ===
    const analisisFields = [
      { field: 'analisisRicketts', name: 'Análisis Ricketts', priceKey: 'ricketts' },
      { field: 'analisisSteiner', name: 'Análisis Steiner', priceKey: 'steiner' },
      { field: 'analisisMcNamara', name: 'Análisis McNamara', priceKey: 'mcNamara' },
      { field: 'analisisBjorks', name: 'Análisis Bjork', priceKey: 'bjork' },
      { field: 'analisisUSP', name: 'Análisis USP', priceKey: 'usp' },
      { field: 'analisisSchwartz', name: 'Análisis Schwartz', priceKey: 'schwartz' },
      { field: 'analisisTweed', name: 'Análisis Tweed', priceKey: 'tweed' },
      { field: 'analisisDowns', name: 'Análisis Downs', priceKey: 'downs' },
      { field: 'analisisRotJarabak', name: 'Análisis Rot Jarabak', priceKey: 'rotJarabak' },
      { field: 'analisisTejidosBlancos', name: 'Análisis Tejidos Blandos', priceKey: 'tejidosBlancos' },
    ];
    for (const { field, name, priceKey } of analisisFields) {
      if (radiografias[field] === true && !existingKeys.has(priceKey)) {
        additionalItems.push({
          category: 'analisis',
          itemName: name,
          itemKey: priceKey,
          price: (radiografiasPricing as any)?.[priceKey] || 50,
          quantity: 1
        });
      }
    }

    return additionalItems;
  };

  const loadRequestBreakdown = async () => {
    try {
      setIsLoading(true);
      const response = await radiographyRequestsApi.getRequestById(parseInt(requestId));
      const request = response.data;

      let items: EditableBreakdownItem[] = [];
      const existingKeys = new Set<string>();

      // 1. Cargar items del breakdown existente
      if (request?.pricing_data?.breakdown && request.pricing_data.breakdown.length > 0) {
        items = request.pricing_data.breakdown.map(normalizeBreakdownItem);
        items.forEach(item => existingKeys.add(item.itemKey));
      }

      // 2. Generar items adicionales desde request_data que no están en el breakdown
      if (request?.request_data) {
        const additionalItems = generateItemsFromRequestData(request.request_data, existingKeys);
        items = [...items, ...additionalItems];
      }

      setBreakdownItems(items);
    } catch (error) {
      toast.error('Error al cargar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular total dinámicamente
  const calculateTotal = () => {
    return breakdownItems.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  };

  const handlePriceChange = (index: number, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    setBreakdownItems(prev => {
      const updated = [...prev];
      updated[index].price = price;
      return updated;
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = calculateTotal();
    if (total <= 0) {
      toast.error('El precio total debe ser mayor a 0');
      return;
    }

    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      setIsSubmitting(true);

      // Reconstruir el breakdown con los precios editados
      const updatedBreakdown = breakdownItems.map(item => ({
        category: item.category,
        itemName: item.itemName,
        itemKey: item.itemKey,
        basePrice: item.price, // Nuevo precio editado
        quantity: item.quantity,
        subtotal: item.price * (item.quantity || 1)
      }));

      // 1. Actualizar pricing_data en la solicitud
      await radiographyRequestsApi.updateRequest(parseInt(requestId), {
        pricing_data: {
          breakdown: updatedBreakdown,
          suggestedPrice: currentPricing?.suggestedPrice || total,
          finalPrice: total,
          status: 'price_set'
        },
        notes: notes.trim() || undefined
      });

      // 2. Crear registro de pago en laboratory_external_payments
      // Esto es lo que permite al admin/recepcionista ver y registrar el pago
      await radiographyApi.setFinalPrice(parseInt(requestId), total, notes.trim() || undefined);

      toast.success('Precio establecido. El pago queda pendiente de cobro.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al establecer precio:', error);
      toast.error('Error al establecer el precio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'tomografia': 'Tomografía 3D',
      'tomografia3D': 'Tomografía 3D',
      'intraoral': 'Radiografías Intraorales',
      'extraoral': 'Radiografías Extraorales',
      'ortodoncias': 'Asesoría Ortodoncia',
      'analisis': 'Análisis Cefalométricos',
      'fotografias': 'Fotografías',
      'general': 'Servicio'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'tomografia': 'bg-cyan-50 border-cyan-200',
      'tomografia3D': 'bg-cyan-50 border-cyan-200',
      'intraoral': 'bg-pink-50 border-pink-200',
      'extraoral': 'bg-blue-50 border-blue-200',
      'ortodoncias': 'bg-purple-50 border-purple-200',
      'analisis': 'bg-green-50 border-green-200',
      'fotografias': 'bg-amber-50 border-amber-200',
      'general': 'bg-gray-50 border-gray-200'
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Contenido del modal */}
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar Precios de Solicitud</h2>
              <p className="text-sm text-gray-500">Paciente: {patientName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Cargando servicios...</span>
              </div>
            ) : (
              <>
                {/* Precio Sugerido Original */}
                {currentPricing?.suggestedPrice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Precio sugerido original del sistema</p>
                        <p className="text-lg font-bold text-blue-700">
                          S/. {currentPricing.suggestedPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Servicios Editables */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Servicios Solicitados (Editar Precios)
                  </h3>

                  {breakdownItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay servicios en esta solicitud
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {breakdownItems.map((item, index) => (
                        <div
                          key={`${item.category}-${item.itemKey}-${index}`}
                          className={`border rounded-lg p-4 ${getCategoryColor(item.category)}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  {getCategoryLabel(item.category)}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">{item.itemName}</p>
                              {item.quantity && item.quantity > 1 && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Cantidad: {item.quantity} unidades
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Precio Unit.
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    S/.
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) => handlePriceChange(index, e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-28 pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-semibold disabled:bg-gray-100"
                                  />
                                </div>
                              </div>

                              {item.quantity && item.quantity > 1 && (
                                <div className="text-right">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Subtotal
                                  </label>
                                  <p className="font-bold text-gray-900 py-2">
                                    S/. {(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Total a Cobrar</p>
                      <p className="text-xs text-green-600">Este precio verá el cliente</p>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      S/. {calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Notas sobre el precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas sobre el precio (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Precio ajustado por complejidad del estudio, descuento aplicado..."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none disabled:bg-gray-100"
                  />
                </div>

                {/* Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Puedes editar el precio de cada servicio individualmente</li>
                        <li>• Al establecer el precio, se crea un cobro pendiente</li>
                        <li>• El Admin/Recepcionista registrará el pago cuando el cliente pague</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Buttons */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Establecer Precio Final
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
