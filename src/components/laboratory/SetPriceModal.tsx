import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyRequestsApi } from '@/services/api/radiographyRequestsApi';
import { radiographyApi } from '@/services/api/radiographyApi';
import { useAuth } from '@/hooks/useAuth';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';
import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import {
  buildBreakdown,
  computeBreakdownTotal,
  getCategoryLabel,
  type NormalizedBreakdownItem
} from '@/utils/pricing/breakdownBuilder';

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

type EditableBreakdownItem = NormalizedBreakdownItem;

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

  useEffect(() => {
    if (isOpen) {
      loadRequestBreakdown();
    }
  }, [isOpen, requestId, radiografiasPricing, tomografiaPricing]);

  const loadRequestBreakdown = async () => {
    try {
      setIsLoading(true);
      const response = await radiographyRequestsApi.getRequestById(parseInt(requestId));
      const request = response.data;
      const items = buildBreakdown(
        request?.pricing_data?.breakdown,
        request?.request_data,
        tomografiaPricing,
        radiografiasPricing
      );
      setBreakdownItems(items);
    } catch (error) {
      toast.error('Error al cargar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => computeBreakdownTotal(breakdownItems);

  const handlePriceChange = (index: number, newPrice: string) => {
    const price = parseFloat(newPrice) || 0;
    setBreakdownItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price };
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

      const updatedBreakdown = breakdownItems.map(item => ({
        category: item.category,
        itemName: item.itemName,
        itemKey: item.itemKey,
        basePrice: item.price,
        quantity: item.quantity,
        subtotal: item.price * (item.quantity || 1)
      }));

      await radiographyRequestsApi.updateRequest(parseInt(requestId), {
        pricing_data: {
          breakdown: updatedBreakdown,
          suggestedPrice: currentPricing?.suggestedPrice || total,
          finalPrice: total,
          status: 'price_set'
        },
        notes: notes.trim() || undefined
      });

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tomografia: 'bg-panocef-light border-panocef-secondary',
      tomografia3D: 'bg-panocef-light border-panocef-secondary',
      intraoral: 'bg-pink-50 border-pink-200',
      extraoral: 'bg-blue-50 border-blue-200',
      ortodoncias: 'bg-panocef-light border-panocef-secondary',
      analisis: 'bg-green-50 border-green-200',
      fotografias: 'bg-amber-50 border-amber-200',
      general: 'bg-gray-50 border-gray-200'
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Cargando servicios...</span>
              </div>
            ) : (
              <>
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
