// Función para formatear los datos de radiografía de forma legible
export const formatRadiographyInfo = (radiographyData: any) => {
  if (!radiographyData) return null;

  const sections = [];

  // Extraer datos de tomografía 3D desde notes si existen
  let tomografiaData: any = null;
  if (radiographyData.notes && radiographyData.notes.startsWith('TOMOGRAFÍA 3D:')) {
    try {
      const jsonStr = radiographyData.notes.replace('TOMOGRAFÍA 3D: ', '');
      tomografiaData = JSON.parse(jsonStr);
    } catch (e) {
    }
  }

  // SECCIÓN: TOMOGRAFÍA 3D
  if (tomografiaData) {
    // Tipo de entrega
    const tiposEntrega = [];
    if (tomografiaData.conInforme) tiposEntrega.push('Con informe');
    if (tomografiaData.sinInforme) tiposEntrega.push('Sin informe');
    if (tomografiaData.dicom) tiposEntrega.push('DICOM');
    if (tomografiaData.soloUsb) tiposEntrega.push('Solo USB');

    if (tiposEntrega.length > 0) {
      sections.push({
        title: 'Tomografía 3D - Tipo de Entrega',
        items: tiposEntrega
      });
    }

    // Campo Pequeño
    const campoPequeno = [];
    if (tomografiaData.endodoncia) {
      campoPequeno.push(`Endodoncia${tomografiaData.numeroPiezasEndo ? ` (Piezas: ${tomografiaData.numeroPiezasEndo})` : ''}`);
    }
    if (tomografiaData.fracturaRadicular) {
      campoPequeno.push(`Fractura radicular${tomografiaData.numeroPiezasFractura ? ` (Piezas: ${tomografiaData.numeroPiezasFractura})` : ''}`);
    }
    if (tomografiaData.anatomiaEndodontica) {
      campoPequeno.push('Anatomía endodóntica');
    }

    if (campoPequeno.length > 0) {
      sections.push({
        title: 'Tomografía 3D - Campo Pequeño',
        items: campoPequeno
      });
    }

    // Campo Mediano
    const campoMediano = [];
    if (tomografiaData.localizacionDiente) {
      campoMediano.push(`Localización de diente impactado${tomografiaData.numeroPiezasLoc ? ` (Piezas: ${tomografiaData.numeroPiezasLoc})` : ''}`);
    }
    if (tomografiaData.implantes) {
      let implantesInfo = 'Implantes';
      if (tomografiaData.numeroCortes) implantesInfo += ` (Cortes: ${tomografiaData.numeroCortes})`;
      if (tomografiaData.conGuiaQx) implantesInfo += ' - Con guía QX';
      campoMediano.push(implantesInfo);
    }
    if (tomografiaData.maxilarSuperiorInferior) {
      campoMediano.push('Maxilar superior e inferior (Sin informe)');
    }

    if (campoMediano.length > 0) {
      sections.push({
        title: 'Tomografía 3D - Campo Mediano',
        items: campoMediano
      });
    }

    // Campo Grande
    const campoGrande = [];
    if (tomografiaData.guiaQx) campoGrande.push('Guía Qx, Vía área');
    if (tomografiaData.ortognatica) campoGrande.push('Ortognática');
    if (tomografiaData.ortodoncia) campoGrande.push('Ortodoncia (MARPE, mini plantes IA.EA, IC.BS)');
    if (tomografiaData.atm) campoGrande.push('ATM (BA+BC)');
    if (tomografiaData.macizoFacial) campoGrande.push('Macizo Facial');

    if (campoGrande.length > 0) {
      sections.push({
        title: 'Tomografía 3D - Campo Grande',
        items: campoGrande
      });
    }

    // Otros
    if (tomografiaData.otros && tomografiaData.otros.trim()) {
      sections.push({
        title: 'Tomografía 3D - Otros',
        items: [tomografiaData.otros]
      });
    }
  }

  // Datos del paciente - Solo mostrar si hay información relevante
  if (radiographyData.patientData) {
    const patient = radiographyData.patientData;
    const patientItems = [
      patient.edad && `Edad: ${patient.edad} años`,
      patient.telefono && `Teléfono: ${patient.telefono}`,
      patient.motivoConsulta && `Motivo: ${patient.motivoConsulta}`
    ].filter(Boolean);

    // Solo agregar sección si hay items
    if (patientItems.length > 0) {
      sections.push({
        title: 'Paciente',
        items: patientItems
      });
    }
  }

  // Datos del doctor - Solo mostrar si hay información relevante
  if (radiographyData.doctorData) {
    const doctor = radiographyData.doctorData;
    const doctorItems = [
      doctor.cop && `COP: ${doctor.cop}`,
      doctor.email && `Email: ${doctor.email}`,
      doctor.telefono && `Teléfono: ${doctor.telefono}`,
      doctor.direccion && `Dirección: ${doctor.direccion}`
    ].filter(Boolean);

    // Solo agregar sección si hay items
    if (doctorItems.length > 0) {
      sections.push({
        title: 'Odontólogo',
        items: doctorItems
      });
    }
  }

  // Radiografías intraorales
  if (radiographyData.radiography?.intraorales) {
    const intra = radiographyData.radiography.intraorales;
    const intraoralItems = [];

    if (intra.tipo && intra.tipo.length > 0) {
      intraoralItems.push(`Tipo: ${intra.tipo.join(', ')}`);
    }

    // Agregar información de bitewing
    if (intra.bitewing) {
      const bitewing = [];
      if (intra.bitewing.molares) {
        const lados = [];
        if (intra.bitewing.molares.derecha) lados.push('derecha');
        if (intra.bitewing.molares.izquierda) lados.push('izquierda');
        if (lados.length > 0) bitewing.push(`Molares: ${lados.join(', ')}`);
      }
      if (intra.bitewing.premolares) {
        const lados = [];
        if (intra.bitewing.premolares.derecha) lados.push('derecha');
        if (intra.bitewing.premolares.izquierda) lados.push('izquierda');
        if (lados.length > 0) bitewing.push(`Premolares: ${lados.join(', ')}`);
      }
      if (bitewing.length > 0) intraoralItems.push(`Bitewing: ${bitewing.join('; ')}`);
    }

    if (intra.oclusal) {
      const oclusal = [];
      if (intra.oclusal.superiores) oclusal.push('superiores');
      if (intra.oclusal.inferiores) oclusal.push('inferiores');
      if (oclusal.length > 0) intraoralItems.push(`Oclusal: ${oclusal.join(', ')}`);
    }

    if (intra.seriada) intraoralItems.push('Seriada');
    if (intra.fotografiaIntraoral) intraoralItems.push('Fotografía intraoral');

    if (intraoralItems.length > 0 || intra.dientesSuperiores?.length > 0 || intra.dientesInferiores?.length > 0 || intra.dientesTemporales?.length > 0) {
      sections.push({
        title: 'Radiografías Intraorales',
        items: intraoralItems,
        dientes: {
          superiores: intra.dientesSuperiores || [],
          inferiores: intra.dientesInferiores || [],
          temporales: intra.dientesTemporales || []
        }
      });
    }
  }

  // Radiografías extraorales
  if (radiographyData.radiography?.extraorales) {
    const extra = radiographyData.radiography.extraorales;
    const extraoralItems = [`Tipo: ${extra.tipo}`];

    const estudios = [];
    if (extra.estudios.panoramica) estudios.push('Panorámica');
    if (extra.estudios.cefalometrica) estudios.push('Cefalométrica');
    if (extra.estudios.carpal) estudios.push('Carpal (Edad ósea)');
    if (extra.estudios.posteriorAnterior) estudios.push('Posterior-Anterior (Frontal)');
    if (extra.estudios.atmBocaAbierta) estudios.push('ATM Boca Abierta');
    if (extra.estudios.atmBocaCerrada) estudios.push('ATM Boca Cerrada');
    if (extra.estudios.fotografiaExtraoral) estudios.push('Fotografía extraoral');

    if (estudios.length > 0) extraoralItems.push(`Estudios: ${estudios.join(', ')}`);

    sections.push({
      title: 'Radiografías Extraorales',
      items: extraoralItems
    });
  }

  // Asesoría ortodoncia
  if (radiographyData.radiography?.asesoriaOrtodoncia) {
    const orto = radiographyData.radiography.asesoriaOrtodoncia;
    const ortoItems = [`Tipo: ${orto.tipo}`];

    if (orto.paquete) ortoItems.push(`Paquete ${orto.paquete}`);
    if (orto.alineadoresInvisibles) ortoItems.push('Alineadores invisibles');
    if (orto.escaneoBucal) ortoItems.push('Escaneo bucal');
    if (orto.impresionDigital) ortoItems.push('Impresión digital');
    if (orto.conGuia) ortoItems.push(`${orto.conGuia === 'con' ? 'Con guía' : 'Sin guía'}`);
    if (orto.guiaImpresa) ortoItems.push(`Guía: ${orto.guiaImpresa === 'impreso' ? 'Impreso' : 'No impreso (digital)'}`);

    sections.push({
      title: 'Asesoría Ortodoncia',
      items: ortoItems
    });
  }

  // Análisis cefalométricos
  if (radiographyData.radiography?.analisisCefalometricos && radiographyData.radiography.analisisCefalometricos.length > 0) {
    sections.push({
      title: 'Análisis Cefalométricos',
      items: radiographyData.radiography.analisisCefalometricos
    });
  }

  return sections;
};
