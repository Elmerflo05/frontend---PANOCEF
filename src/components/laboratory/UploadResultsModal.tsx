import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileImage, FileText, Check, Loader2, Link as LinkIcon, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyApi } from '@/services/api/radiographyApi';

interface UploadResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: string;
  patientName: string;
  studyType: string;
}

export const UploadResultsModal = ({
  isOpen,
  onClose,
  onSuccess,
  requestId,
  patientName,
  studyType
}: UploadResultsModalProps) => {
  // Estados para múltiples archivos
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Manejar selección de múltiples imágenes
  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar cada archivo
    for (const file of files) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/dicom'];
      if (!validImageTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
        toast.error(`${file.name}: Formato no válido. Use JPG, PNG o DICOM`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: La imagen no debe superar 10MB`);
        continue;
      }

      // Agregar archivo si pasa validaciones
      setImageFiles(prev => [...prev, file]);
    }

    // Limpiar input
    e.target.value = '';
  };

  // Manejar selección de múltiples PDFs
  const handlePDFsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar cada archivo
    for (const file of files) {
      const validDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validDocTypes.includes(file.type)) {
        toast.error(`${file.name}: Formato no válido. Use PDF o DOCX`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: El documento no debe superar 10MB`);
        continue;
      }

      // Agregar archivo si pasa validaciones
      setPdfFiles(prev => [...prev, file]);
    }

    // Limpiar input
    e.target.value = '';
  };

  // Eliminar imagen
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Eliminar PDF
  const removePDF = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Agregar enlace externo
  const addExternalLink = () => {
    if (!newLink.trim()) {
      toast.error('Ingresa un enlace válido');
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(newLink.trim());
    } catch {
      toast.error('El enlace no es válido. Debe incluir http:// o https://');
      return;
    }

    setExternalLinks(prev => [...prev, newLink.trim()]);
    setNewLink('');
    toast.success('Enlace agregado');
  };

  // Eliminar enlace
  const removeLink = (index: number) => {
    setExternalLinks(prev => prev.filter((_, i) => i !== index));
  };

  // Subir resultados
  const handleSubmit = async () => {
    if (imageFiles.length === 0 && pdfFiles.length === 0 && externalLinks.length === 0) {
      toast.error('Debe agregar al menos una imagen, PDF o enlace externo');
      return;
    }

    setIsUploading(true);

    try {
      // Combinar todos los archivos (imágenes y PDFs)
      const allFiles = [...imageFiles, ...pdfFiles];

      // Llamar a la API real para subir los resultados
      const response = await radiographyApi.uploadResults(
        parseInt(requestId),
        allFiles,
        externalLinks
      );

      if (response.success) {
        const { counts } = response.data;
        toast.success(
          `Resultados subidos: ${counts.image} imagen(es), ${counts.document} documento(s), ${counts.external_link} enlace(s)`
        );
        onSuccess();
        handleClose();
      } else {
        throw new Error('Error al subir los resultados');
      }
    } catch (error: unknown) {
      console.error('Error al subir resultados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir los resultados';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Cerrar modal y limpiar estado
  const handleClose = () => {
    setImageFiles([]);
    setPdfFiles([]);
    setExternalLinks([]);
    setNewLink('');
    onClose();
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
        style={{ zIndex: 9999 }}
        onClick={handleClose}
      >
        {/* Contenido del modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subir Resultados</h2>
                <p className="text-sm text-gray-600">
                  {patientName} - {studyType}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - con scroll */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Enlaces Externos */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Enlaces Externos (Opcional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Agrega enlaces de WeTransfer, Google Drive, Dropbox, etc.
              </p>

              {/* Input para agregar enlace */}
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExternalLink()}
                  placeholder="https://wetransfer.com/downloads/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isUploading}
                />
                <button
                  onClick={addExternalLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  disabled={isUploading}
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {/* Lista de enlaces */}
              {externalLinks.length > 0 && (
                <div className="space-y-2">
                  {externalLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {link}
                        </a>
                      </div>
                      <button
                        onClick={() => removeLink(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors ml-2"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imágenes del Estudio */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <FileImage className="w-4 h-4 inline mr-2" />
                Imágenes del Estudio (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,.dcm"
                  onChange={handleImagesSelect}
                  className="hidden"
                  id="images-upload"
                  disabled={isUploading}
                  multiple
                />
                <label
                  htmlFor="images-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileImage className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click para seleccionar imágenes
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG o DICOM (máx. 10MB cada una) - Múltiples archivos
                  </p>
                </label>
              </div>

              {/* Lista de imágenes seleccionadas */}
              {imageFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {imageFiles.length} imagen(es) seleccionada(s)
                  </p>
                  {imageFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documentos PDF */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <FileText className="w-4 h-4 inline mr-2" />
                Documentos PDF (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handlePDFsSelect}
                  className="hidden"
                  id="pdfs-upload"
                  disabled={isUploading}
                  multiple
                />
                <label
                  htmlFor="pdfs-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click para seleccionar documentos
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF o DOCX (máx. 10MB cada uno) - Múltiples archivos
                  </p>
                </label>
              </div>

              {/* Lista de PDFs seleccionados */}
              {pdfFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {pdfFiles.length} documento(s) seleccionado(s)
                  </p>
                  {pdfFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => removePDF(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            {(imageFiles.length > 0 || pdfFiles.length > 0 || externalLinks.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Al guardar los resultados, el estado de la solicitud
                  cambiará automáticamente a "Completado". El cliente externo podrá ver y descargar
                  todos los archivos y enlaces que subas.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              disabled={isUploading || (imageFiles.length === 0 && pdfFiles.length === 0 && externalLinks.length === 0)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Guardar Resultados
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
