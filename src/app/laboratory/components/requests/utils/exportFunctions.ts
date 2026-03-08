import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';

export const exportToExcel = (
  filteredRequests: any[],
  formatRadiographyInfo: (data: any) => any,
  STUDY_STATUS: any,
  IMAGING_STUDY_TYPES: any,
  useCyanTheme: boolean
) => {
  try {
    const themeColor = useCyanTheme ? '#0891b2' : '#7c3aed';
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: ${themeColor}; color: white; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <h2>Solicitudes de Radiografía - PanoCef</h2>
        <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Doctor</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Tipo de Estudio</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredRequests.forEach(req => {
      const sections = formatRadiographyInfo(req.radiographyData);
      const detalles = sections?.map(s => `${s.title}: ${s.items.join(', ')}`).join(' | ') || 'N/A';

      tableHTML += `
        <tr>
          <td>${req.patientName || 'N/A'}</td>
          <td>${req.doctorName || 'N/A'}</td>
          <td>${new Date(req.date).toLocaleDateString('es-ES')}</td>
          <td>${new Date(req.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${STUDY_STATUS[req.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS]?.label || 'N/A'}</td>
          <td>${IMAGING_STUDY_TYPES[req.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label || 'N/A'}</td>
          <td>${detalles}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solicitudes_radiografia_${formatDateToYMD(new Date())}.xls`;
    link.click();

    toast.success('Exportado a Excel correctamente');
  } catch (error) {
    toast.error('Error al exportar a Excel');
  }
};

export const exportToPDF = (
  filteredRequests: any[],
  formatRadiographyInfo: (data: any) => any,
  STUDY_STATUS: any,
  IMAGING_STUDY_TYPES: any,
  useCyanTheme: boolean
) => {
  try {
    const themeColor = useCyanTheme ? '#0891b2' : '#7c3aed';
    const themeColorDark = useCyanTheme ? '#0e7490' : '#6d28d9';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de exportación');
      return;
    }

    let requestsHTML = '';
    filteredRequests.forEach((request, index) => {
      const sections = formatRadiographyInfo(request.radiographyData);
      const sectionsHTML = sections?.map(section => {
        let itemsHTML = section.items.map(item => `<li>${item}</li>`).join('');

        let dientesHTML = '';
        if (section.dientes) {
          dientesHTML += '<div style="margin-top: 10px;">';

          if (section.dientes.superiores.length > 0) {
            const superiores = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'];
            dientesHTML += '<p style="margin: 5px 0; font-weight: bold;">Dientes Superiores:</p>';
            dientesHTML += '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">';
            superiores.forEach(diente => {
              const isSelected = section.dientes.superiores.includes(diente);
              dientesHTML += `<span style="padding: 4px 8px; font-size: 11px; border-radius: 3px; ${
                isSelected
                  ? `background-color: ${themeColor}; color: white; font-weight: bold; border: 2px solid ${themeColorDark};`
                  : 'background-color: #f3f4f6; color: #9ca3af; border: 1px solid #d1d5db;'
              }">${diente}</span>`;
            });
            dientesHTML += '</div>';
          }

          if (section.dientes.inferiores.length > 0) {
            const inferiores = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'];
            dientesHTML += '<p style="margin: 5px 0; font-weight: bold;">Dientes Inferiores:</p>';
            dientesHTML += '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">';
            inferiores.forEach(diente => {
              const isSelected = section.dientes.inferiores.includes(diente);
              dientesHTML += `<span style="padding: 4px 8px; font-size: 11px; border-radius: 3px; ${
                isSelected
                  ? `background-color: ${themeColor}; color: white; font-weight: bold; border: 2px solid ${themeColorDark};`
                  : 'background-color: #f3f4f6; color: #9ca3af; border: 1px solid #d1d5db;'
              }">${diente}</span>`;
            });
            dientesHTML += '</div>';
          }

          if (section.dientes.temporales.length > 0) {
            dientesHTML += '<p style="margin: 5px 0; font-weight: bold;">Dientes Temporales:</p>';
            dientesHTML += '<div style="margin-bottom: 5px;">';
            dientesHTML += '<p style="margin: 2px 0; font-size: 11px;">Superiores:</p>';
            dientesHTML += '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px;">';
            const tempSuperiores = ['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5'];
            tempSuperiores.forEach(diente => {
              const isSelected = section.dientes.temporales.includes(diente);
              dientesHTML += `<span style="padding: 4px 8px; font-size: 11px; border-radius: 3px; ${
                isSelected
                  ? `background-color: ${themeColor}; color: white; font-weight: bold; border: 2px solid ${themeColorDark};`
                  : 'background-color: #f3f4f6; color: #9ca3af; border: 1px solid #d1d5db;'
              }">${diente}</span>`;
            });
            dientesHTML += '</div>';

            dientesHTML += '<p style="margin: 2px 0; font-size: 11px;">Inferiores:</p>';
            dientesHTML += '<div style="display: flex; flex-wrap: wrap; gap: 4px;">';
            const tempInferiores = ['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5'];
            tempInferiores.forEach(diente => {
              const isSelected = section.dientes.temporales.includes(diente);
              dientesHTML += `<span style="padding: 4px 8px; font-size: 11px; border-radius: 3px; ${
                isSelected
                  ? `background-color: ${themeColor}; color: white; font-weight: bold; border: 2px solid ${themeColorDark};`
                  : 'background-color: #f3f4f6; color: #9ca3af; border: 1px solid #d1d5db;'
              }">${diente}</span>`;
            });
            dientesHTML += '</div></div>';
          }

          dientesHTML += '</div>';
        }

        return `
          <div style="margin-bottom: 15px;">
            <h4 style="color: ${themeColor}; margin-bottom: 5px;">${section.title}</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">${itemsHTML}</ul>
            ${dientesHTML}
          </div>
        `;
      }).join('') || '';

      requestsHTML += `
        <div style="page-break-after: ${index < filteredRequests.length - 1 ? 'always' : 'auto'}; margin-bottom: 40px;">
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid ${themeColor}; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div><strong>Paciente:</strong> ${request.patientName || 'N/A'}</div>
              <div><strong>Doctor:</strong> ${request.doctorName || 'N/A'}</div>
              <div><strong>Fecha:</strong> ${new Date(request.date).toLocaleDateString('es-ES')}</div>
              <div><strong>Hora:</strong> ${new Date(request.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Estado:</strong> ${STUDY_STATUS[request.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS]?.label || 'N/A'}</div>
              <div><strong>Tipo:</strong> ${IMAGING_STUDY_TYPES[request.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label || 'N/A'}</div>
            </div>
          </div>
          ${sectionsHTML}
        </div>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solicitudes de Radiografía</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid ${themeColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: ${themeColor};
            margin: 0;
          }
          h4 {
            margin-top: 0;
          }
          ul {
            list-style-type: disc;
          }
          @media print {
            body { margin: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Solicitudes de Radiografía</h1>
          <p>PanoCef - Centro de Imágenes Dentomaxilofacial</p>
          <p style="color: #666;">Total de solicitudes: ${filteredRequests.length}</p>
        </div>

        ${requestsHTML}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af;">
          <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    toast.success('Documento PDF generado - Use Ctrl+P para guardar como PDF');
  } catch (error) {
    toast.error('Error al generar PDF');
  }
};

// ============================================================================
// MAPEO DE LABELS (igual que en RequestDetailsModal)
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

const TOMO_CATEGORIES_CONFIG: Record<string, { title: string }> = {
  tipoEntrega: { title: 'TIPO DE ENTREGA' },
  campoPequeno: { title: 'CAMPO PEQUEÑO' },
  campoMediano: { title: 'CAMPO MEDIANO' },
  campoGrande: { title: 'CAMPO MEDIANO/GRANDE' },
  ortodoncia: { title: 'ORTODONCIA' },
  otrasOpciones: { title: 'OTRAS OPCIONES' },
  otros: { title: 'OTROS' }
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

const RADIO_CATEGORIES_CONFIG: Record<string, { title: string }> = {
  periapical: { title: 'INTRAORALES - PERIAPICAL' },
  bitewing: { title: 'BITEWING' },
  oclusal: { title: 'OCLUSAL' },
  otrasIntraorales: { title: 'OTRAS INTRAORALES' },
  extraorales: { title: 'EXTRAORALES' },
  asesoriaOrtodoncia: { title: 'ASESORÍA ORTODONCIA' },
  serviciosAdicionales: { title: 'SERVICIOS ADICIONALES' },
  analisisCefalometricos: { title: 'ANÁLISIS CEFALOMÉTRICOS' },
  otros: { title: 'OTROS' }
};

// ============================================================================
// Funciones para procesar datos de Tomografía y Radiografías
// ============================================================================

const processTomografia = (tomografia3D: any) => {
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

const processRadiografias = (radiografias: any) => {
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

  const ortodonciaTipo = radiografias.ortodonciaTipo || [];
  if (ortodonciaTipo.length) {
    asesoriaOrtodoncia.push({ label: 'Formato', details: ortodonciaTipo.map((t: string) => t === 'fisico' ? 'Físico' : 'Digital') });
  }

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

// ============================================================================
// handlePrintRequest - Abre vista de impresión con formato profesional
// ============================================================================

export const handlePrintRequest = (
  request: any,
  formatRadiographyInfo: (data: any) => any,
  STUDY_STATUS: any,
  IMAGING_STUDY_TYPES: any,
  useCyanTheme: boolean
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('No se pudo abrir la ventana de impresión');
    return;
  }

  // Obtener datos
  const radiographyData = request.radiographyData;
  const patientData = radiographyData?.patientData;
  const doctorData = radiographyData?.doctorData;
  const tomografia3D = radiographyData?.tomografia3D;
  const radiografias = radiographyData?.radiografias;
  const pricing = radiographyData?.pricing;

  const tomografiaData = processTomografia(tomografia3D);
  const radiografiasData = processRadiografias(radiografias);
  const hasTomografia = Object.keys(tomografiaData).length > 0;
  const hasRadiografias = Object.keys(radiografiasData).length > 0;

  // Colores para categorías
  const tomoColors: Record<string, { bg: string; text: string; border: string }> = {
    tipoEntrega: { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
    campoPequeno: { bg: '#dcfce7', text: '#15803d', border: '#4ade80' },
    campoMediano: { bg: '#fef9c3', text: '#a16207', border: '#facc15' },
    campoGrande: { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' },
    ortodoncia: { bg: '#e0e7ff', text: '#4338ca', border: '#818cf8' },
    otrasOpciones: { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa' },
    otros: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
  };

  const radioColors: Record<string, { bg: string; text: string; border: string }> = {
    periapical: { bg: '#fce7f3', text: '#be185d', border: '#f472b6' },
    bitewing: { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa' },
    oclusal: { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
    otrasIntraorales: { bg: '#cffafe', text: '#0e7490', border: '#22d3ee' },
    extraorales: { bg: '#dcfce7', text: '#15803d', border: '#4ade80' },
    asesoriaOrtodoncia: { bg: '#ede9fe', text: '#6d28d9', border: '#a78bfa' },
    serviciosAdicionales: { bg: '#fef3c7', text: '#b45309', border: '#fbbf24' },
    analisisCefalometricos: { bg: '#ffe4e6', text: '#be123c', border: '#fb7185' },
    otros: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
  };

  // Generar HTML para estudios de item
  const generateStudyItemHTML = (item: { label: string; details?: string[]; notes?: string; teeth?: { fisico?: number[]; digital?: number[] } }, colors: { bg: string; text: string; border: string }) => {
    let detailsHTML = '';
    if (item.details && item.details.length > 0) {
      detailsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
        ${item.details.map(d => `<span style="background: ${colors.bg}; color: ${colors.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid ${colors.border};">${d}</span>`).join('')}
      </div>`;
    }

    let notesHTML = '';
    if (item.notes) {
      notesHTML = `<div style="margin-top: 6px; padding: 6px; background: #f9fafb; border-radius: 4px; font-size: 11px; color: #6b7280; font-style: italic;">Nota: ${item.notes}</div>`;
    }

    let teethHTML = '';
    if (item.teeth) {
      if (item.teeth.fisico && item.teeth.fisico.length > 0) {
        teethHTML += `
          <div style="margin-top: 8px; background: #fce7f3; padding: 8px; border-radius: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="background: #fbcfe8; color: #be185d; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">FÍSICO</span>
              <span style="font-size: 11px; color: #db2777;">${item.teeth.fisico.length} dientes</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${item.teeth.fisico.map(t => `<span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #ec4899; color: white; border-radius: 4px; font-size: 11px; font-weight: bold;">${t}</span>`).join('')}
            </div>
          </div>`;
      }
      if (item.teeth.digital && item.teeth.digital.length > 0) {
        teethHTML += `
          <div style="margin-top: 8px; background: #dbeafe; padding: 8px; border-radius: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="background: #bfdbfe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">DIGITAL</span>
              <span style="font-size: 11px; color: #2563eb;">${item.teeth.digital.length} dientes</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${item.teeth.digital.map(t => `<span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 4px; font-size: 11px; font-weight: bold;">${t}</span>`).join('')}
            </div>
          </div>`;
      }
    }

    return `
      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 6px; padding: 8px; margin-bottom: 6px;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; background: #0d9488; color: white; border-radius: 3px; font-size: 10px; flex-shrink: 0;">✓</span>
          <div style="flex: 1;">
            <span style="font-weight: 600; font-size: 12px; color: ${colors.text};">${item.label}</span>
            ${detailsHTML}
            ${notesHTML}
            ${teethHTML}
          </div>
        </div>
      </div>`;
  };

  // Generar sección de categoría
  const generateCategoryHTML = (title: string, items: any[], colors: { bg: string; text: string; border: string }) => {
    return `
      <div style="margin-bottom: 12px;">
        <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.text};">${title}</span>
        </div>
        ${items.map(item => generateStudyItemHTML(item, colors)).join('')}
      </div>`;
  };

  // Generar HTML de Tomografía 3D
  let tomografiaHTML = '';
  if (hasTomografia) {
    let categoriesHTML = '';
    TOMO_CATEGORIES_ORDER.forEach(catKey => {
      const items = tomografiaData[catKey];
      if (!items || items.length === 0) return;
      const config = TOMO_CATEGORIES_CONFIG[catKey];
      const colors = tomoColors[catKey] || { bg: '#cffafe', text: '#0e7490', border: '#22d3ee' };
      categoriesHTML += generateCategoryHTML(config.title, items, colors);
    });

    tomografiaHTML = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <div style="background: linear-gradient(to right, #ecfeff, #ccfbf1); padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">🔬</span>
              <span style="font-weight: bold; color: #1f2937;">Tomografía 3D</span>
            </div>
            <span style="background: #cffafe; color: #0e7490; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;">${Object.values(tomografiaData).flat().length} items</span>
          </div>
        </div>
        <div style="padding: 12px;">${categoriesHTML}</div>
      </div>`;
  }

  // Generar HTML de Radiografías
  let radiografiasHTML = '';
  if (hasRadiografias) {
    let categoriesHTML = '';
    RADIO_CATEGORIES_ORDER.forEach(catKey => {
      const items = radiografiasData[catKey];
      if (!items || items.length === 0) return;
      const config = RADIO_CATEGORIES_CONFIG[catKey];
      const colors = radioColors[catKey] || { bg: '#ccfbf1', text: '#0f766e', border: '#2dd4bf' };
      categoriesHTML += generateCategoryHTML(config.title, items, colors);
    });

    radiografiasHTML = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <div style="background: linear-gradient(to right, #ccfbf1, #d1fae5); padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">📷</span>
              <span style="font-weight: bold; color: #1f2937;">Radiografías</span>
            </div>
            <span style="background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;">${Object.values(radiografiasData).flat().length} items</span>
          </div>
        </div>
        <div style="padding: 12px;">${categoriesHTML}</div>
      </div>`;
  }

  // Generar HTML de precios
  let pricingHTML = '';
  if (pricing && pricing.breakdown && pricing.breakdown.length > 0) {
    const itemsHTML = pricing.breakdown.map((item: any) => {
      const displayName = item.itemName || item.service || 'Item';
      const displayPrice = item.subtotal ?? item.price ?? 0;
      const displayQuantity = item.quantity || 1;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${item.category === 'tomografia3D' ? '#06b6d4' : item.category === 'intraoral' ? '#3b82f6' : '#8b5cf6'}; flex-shrink: 0;"></span>
            <span style="font-size: 12px; color: #1f2937;">${displayName}</span>
            ${displayQuantity > 1 ? `<span style="font-size: 11px; color: #9ca3af;">x${displayQuantity}</span>` : ''}
          </div>
          <span style="font-weight: 600; color: #1f2937; font-size: 12px;">S/ ${displayPrice.toFixed(2)}</span>
        </div>`;
    }).join('');

    pricingHTML = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <div style="background: linear-gradient(to right, #d1fae5, #a7f3d0); padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">💰</span>
              <span style="font-weight: bold; color: #1f2937;">Desglose de Precios</span>
            </div>
            <span style="background: #d1fae5; color: #047857; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;">${pricing.breakdown.length} items</span>
          </div>
        </div>
        <div style="padding: 12px;">
          ${itemsHTML}
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #0d9488; border-radius: 8px; margin-top: 12px;">
            <span style="font-size: 14px; font-weight: bold; color: white;">TOTAL</span>
            <span style="font-size: 18px; font-weight: bold; color: white;">S/ ${(pricing.finalPrice || pricing.suggestedPrice || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>`;
  }

  // Generar HTML de notas
  let notesHTML = '';
  const notesContent = request.notes || radiographyData?.notes || patientData?.motivoConsulta;
  if (notesContent) {
    notesHTML = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <div style="background: linear-gradient(to right, #fef3c7, #fde68a); padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">📝</span>
            <span style="font-weight: bold; color: #1f2937;">Indicaciones / Notas</span>
          </div>
        </div>
        <div style="padding: 12px;">
          <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px;">
            <p style="margin: 0; font-size: 12px; color: #1f2937; white-space: pre-wrap;">${notesContent}</p>
          </div>
        </div>
      </div>`;
  }

  // Datos formateados
  const pName = patientData?.nombres || patientData?.nombre?.split(' ')[0] || '-';
  const pLastName = patientData?.apellidos || patientData?.nombre?.split(' ').slice(1).join(' ') || '-';
  const dName = doctorData?.nombres || doctorData?.nombre?.split(' ')[0] || doctorData?.doctor?.replace('Dr. ', '').split(' ')[0] || '-';
  const dLastName = doctorData?.apellidos || doctorData?.nombre?.split(' ').slice(1).join(' ') || '-';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Solicitud de Estudio - ${pName} ${pLastName}</title>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #1f2937; font-size: 13px; line-height: 1.4; }
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        @page { margin: 10mm; }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto; padding: 16px;">

        <!-- HEADER -->
        <div style="background: linear-gradient(to right, #0d9488, #0891b2); border-radius: 12px; padding: 16px 20px; color: white; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <img src="/GENESIS-PANOCEF-final-01.png" alt="PANOCEF" style="height: 50px; filter: brightness(0) invert(1);" onerror="this.style.display='none'">
              <div>
                <h1 style="font-size: 18px; font-weight: bold; margin: 0;">SOLICITUD DE ESTUDIO</h1>
                <p style="font-size: 12px; opacity: 0.9; margin-top: 2px;">${radiographyData?.radiographyType || 'Estudio de Imágenes'}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; opacity: 0.9;">${new Date(request.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p style="font-size: 11px; opacity: 0.9;">${new Date(request.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              ${pricing ? `<p style="font-size: 16px; font-weight: bold; margin-top: 4px;">S/ ${(pricing.finalPrice || pricing.suggestedPrice || 0).toFixed(2)}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- DATOS PACIENTE Y DOCTOR -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">

          <!-- Paciente -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 28px; height: 28px; background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 12px;">👤</span>
              </div>
              <span style="font-weight: bold; font-size: 12px; color: #1f2937;">Datos del Paciente</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">DNI</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${patientData?.dni || '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">EDAD</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${patientData?.edad ? `${patientData.edad} años` : '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">NOMBRES</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${pName}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">APELLIDOS</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${pLastName}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">TELÉFONO</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${patientData?.telefono || '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">EMAIL</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937; overflow: hidden; text-overflow: ellipsis;">${patientData?.email || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Doctor -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 28px; height: 28px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 12px;">🩺</span>
              </div>
              <span style="font-weight: bold; font-size: 12px; color: #1f2937;">Datos del Odontólogo</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">NOMBRES</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${dName}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">APELLIDOS</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${dLastName}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">COP</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${doctorData?.colegiatura || doctorData?.cop || '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">ESPECIALIDAD</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${doctorData?.especialidad || '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">TELÉFONO</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937;">${doctorData?.telefono || '-'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px;">
                <p style="font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">EMAIL</p>
                <p style="font-size: 12px; font-weight: 600; color: #1f2937; overflow: hidden; text-overflow: ellipsis;">${doctorData?.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ESTUDIOS -->
        ${tomografiaHTML}
        ${radiografiasHTML}

        <!-- PRECIOS -->
        ${pricingHTML}

        <!-- NOTAS -->
        ${notesHTML}

        <!-- FOOTER -->
        <div style="text-align: center; padding: 16px; border-top: 1px solid #e5e7eb; margin-top: 16px; color: #9ca3af; font-size: 11px;">
          <p>PANOCEF - Centro de Diagnóstico por Imágenes</p>
          <p style="margin-top: 4px;">Documento generado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
