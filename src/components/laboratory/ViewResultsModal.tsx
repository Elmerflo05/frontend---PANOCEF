import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Download, FileImage, FileText, Eye, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyApi } from '@/services/api/radiographyApi';
import { useState } from 'react';

interface ViewResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsDelivered?: () => void;
  requestId: string;
  patientName: string;
  studyType: string;
  images?: string[];
  reportDocument?: string; // Para compatibilidad con datos antiguos
  reportDocuments?: string[]; // Nuevo: múltiples PDFs
  externalLinks?: string[]; // Nuevo: enlaces externos
  status: string;
  canMarkAsDelivered?: boolean;
}

export const ViewResultsModal = ({
  isOpen,
  onClose,
  onMarkAsDelivered,
  requestId,
  patientName,
  studyType,
  images = [],
  reportDocument,
  reportDocuments = [],
  externalLinks = [],
  status,
  canMarkAsDelivered = false
}: ViewResultsModalProps) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isMarkingAsDelivered, setIsMarkingAsDelivered] = useState(false);

  // Combinar reportDocument antiguo con reportDocuments nuevo
  const allPDFs = reportDocuments.length > 0
    ? reportDocuments
    : (reportDocument ? [reportDocument] : []);

  // Descargar archivo (Base64 o URL)
  const downloadFile = async (fileSource: string, filename: string) => {
    try {
      // Si es Base64, descargar directamente
      if (fileSource.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileSource;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Archivo descargado correctamente');
        return;
      }

      // Si es URL, hacer fetch y descargar
      const response = await fetch(fileSource);
      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Archivo descargado correctamente');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  // Marcar como entregada usando endpoint específico
  // Este endpoint permite tanto al técnico como al cliente externo marcar como entregada
  const handleMarkAsDelivered = async () => {
    if (!canMarkAsDelivered) return;

    setIsMarkingAsDelivered(true);

    try {
      // Usar endpoint específico mark-delivered
      await radiographyApi.markAsDelivered(parseInt(requestId));

      toast.success('Solicitud marcada como entregada');
      onMarkAsDelivered?.();
      onClose();
    } catch (error: any) {
      console.error('Error al marcar como entregada:', error);
      toast.error(error?.message || 'Error al actualizar el estado');
    } finally {
      setIsMarkingAsDelivered(false);
    }
  };

  // Obtener extensión del archivo desde Base64 o URL
  const getFileExtension = (source: string): string => {
    // Si es Base64
    if (source.startsWith('data:image/jpeg') || source.startsWith('data:image/jpg')) return 'jpg';
    if (source.startsWith('data:image/png')) return 'png';
    if (source.startsWith('data:application/pdf')) return 'pdf';
    if (source.startsWith('data:application/msword')) return 'doc';
    if (source.startsWith('data:application/vnd.openxmlformats')) return 'docx';
    if (source.startsWith('data:application/dicom')) return 'dcm';
    if (source.startsWith('data:')) return 'file';

    // Si es URL, extraer extensión del nombre de archivo
    try {
      const url = new URL(source, window.location.origin);
      const pathname = url.pathname;
      const ext = pathname.split('.').pop()?.toLowerCase();
      if (ext && ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'dcm', 'dicom'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    } catch {
      // No es una URL válida
    }

    return 'file';
  };

  // Obtener nombre de archivo desde URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'archivo';
    } catch {
      return 'archivo';
    }
  };

  // Verificar si la fuente es una imagen
  const isImage = (source: string): boolean => {
    const ext = getFileExtension(source);
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext) || source.startsWith('data:image/');
  };

  if (!isOpen) return null;

  const hasResults = images.length > 0 || allPDFs.length > 0 || externalLinks.length > 0;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-panocef-primary to-panocef-accent px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Resultados del Estudio</h2>
                <p className="text-sm text-white/80">
                  {patientName} - {studyType}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {!hasResults ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileImage className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No hay resultados disponibles aún</p>
              <p className="text-sm text-gray-500 mt-2">
                Los resultados aparecerán aquí cuando el técnico los suba
              </p>
            </div>
          ) : (
            <>
              {/* Enlaces Externos */}
              {externalLinks.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-panocef-light to-blue-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-gray-800">Enlaces de Descarga ({externalLinks.length})</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {externalLinks.map((link, index) => (
                      <div
                        key={index}
                        className="border border-blue-200 bg-blue-50 rounded-lg p-3 hover:border-blue-400 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {externalLinks.length > 1 ? `Enlace #${index + 1}` : 'Enlace Externo'}
                          </p>
                          <p className="text-xs text-blue-600 truncate">{link}</p>
                        </div>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imágenes */}
              {images.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-panocef-light to-blue-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-panocef-primary" />
                      <span className="font-bold text-gray-800">Imágenes del Estudio ({images.length})</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((image, index) => {
                        const fileName = image.startsWith('data:')
                          ? `imagen-${index + 1}.${getFileExtension(image)}`
                          : getFileNameFromUrl(image);

                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-2 hover:border-panocef-secondary transition-colors"
                          >
                            {isImage(image) ? (
                              <img
                                src={image}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-24 object-cover rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setViewingImage(image)}
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center mb-2">
                                <FileImage className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <button
                              onClick={() => downloadFile(image, fileName)}
                              className="w-full flex items-center justify-center gap-1 bg-panocef-primary text-white px-2 py-1 rounded hover:bg-panocef-dark transition-colors text-xs"
                            >
                              <Download className="w-3 h-3" />
                              Descargar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos PDF */}
              {allPDFs.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-gray-800">Informes/Documentos ({allPDFs.length})</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allPDFs.map((pdf, index) => {
                        const fileName = pdf.startsWith('data:')
                          ? `informe-${index + 1}.${getFileExtension(pdf)}`
                          : getFileNameFromUrl(pdf);

                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 hover:border-green-400 transition-colors flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {allPDFs.length > 1 ? `Documento ${index + 1}` : 'Informe'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getFileExtension(pdf).toUpperCase()}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadFile(pdf, fileName)}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm flex-shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Opción de marcar como entregada */}
              {canMarkAsDelivered && status === 'completed' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-panocef-light to-blue-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-panocef-primary" />
                      <span className="font-bold text-gray-800">Confirmar Recepción</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      ¿Ya descargaste tus resultados?
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Al confirmar, esta solicitud se marcará como "Entregada"
                    </p>
                    <button
                      onClick={handleMarkAsDelivered}
                      disabled={isMarkingAsDelivered}
                      className="bg-panocef-primary text-white px-4 py-2 rounded-lg hover:bg-panocef-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMarkingAsDelivered ? 'Confirmando...' : 'Confirmar Recepción'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>

      {/* Modal de visualización de imagen ampliada */}
      {viewingImage && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[10000]"
          onClick={() => setViewingImage(null)}
        >
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80"
          />

          {/* Contenido del modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-6xl max-h-[90vh] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={viewingImage}
              alt="Vista ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </motion.div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
