/**
 * Adaptadores de tipos para compatibilidad legacy
 *
 * Proporciona funciones helper para convertir datos de tomografía
 * del formato separado (PatientData, DoctorData, Tomografia3DFormData)
 * al formato legacy combinado.
 */

import type {
  PatientData,
  DoctorData,
  Tomografia3DFormData
} from '../types';

/**
 * Tipo legacy para compatibilidad - define la estructura combinada antigua
 * donde paciente, doctor y tomografía estaban en un solo objeto
 */
interface LegacyTomografiaFormData {
  // Datos del Paciente
  nombres: string;
  apellidos: string;
  edad: string;
  dni: string;
  telefono: string;
  motivoConsulta: string;
  // Tipo de Entrega
  conInforme: boolean;
  sinInforme: boolean;
  dicom: boolean;
  soloUsb: boolean;
  // Campo Pequeño
  endodoncia: boolean;
  numeroPiezasEndo: string;
  fracturaRadicular: boolean;
  numeroPiezasFractura: string;
  anatomiaEndodontica: boolean;
  numeroPiezasAnatEndo: string;
  // Campo Mediano
  localizacionDiente: boolean;
  numeroPiezasLoc: string;
  implantes: boolean;
  numeroCortes: string;
  conGuiaQx: boolean;
  tipoGuiaImplante: 'guiaTomografica' | 'sinGuia' | '';
  maxilarSuperiorInferior: boolean;
  // Campo Grande
  viaAerea: boolean;
  tipoGuiaViaAerea: 'conGuia' | 'sinGuia' | '';
  ortognatica: boolean;
  tipoOrtognatica: 'conGuia' | 'sinGuia' | 'conPlanificacionQuirurgica' | '';
  // Ortodoncia
  ortodonciaMarpe: boolean;
  ortodonciaMiniImplantes: boolean;
  ortodonciaIntraAlveolares: boolean;
  ortodonciaExtraAlveolares: boolean;
  ortodonciaInfracigomatico: boolean;
  ortodonciaBuccalShelf: boolean;
  tipoGuiaOrtodoncia: 'conGuia' | 'sinGuia' | '';
  ortodonciaGuiaImpresa: 'impreso' | 'digital' | '';
  // Otras opciones
  atm: boolean;
  tipoAtm: 'bocaAbierta' | 'bocaCerrada' | '';
  macizoFacial: boolean;
  tipoMacizoFacial: 'tercioMedioSuperior' | 'tercioMedioInferior' | '';
  otros: string;
  // Datos del Odontólogo
  doctor: string;
  cop: string;
  direccion: string;
  email: string;
  telefonoDoctor: string;
}

/**
 * Convierte datos separados al formato legacy combinado
 *
 * @deprecated Usar transformToSubmission directamente con tipos separados
 * @param patient - Datos del paciente
 * @param doctor - Datos del doctor
 * @param tomografia - Datos de tomografía
 * @returns Objeto en formato legacy (paciente + doctor + tomografía combinados)
 */
export function toLegacyTomografiaFormData(
  patient: PatientData,
  doctor: DoctorData,
  tomografia: Tomografia3DFormData
): LegacyTomografiaFormData {
  return {
    // Datos del Paciente
    nombres: patient.nombres,
    apellidos: patient.apellidos,
    edad: patient.edad,
    dni: patient.dni,
    telefono: patient.telefono,
    motivoConsulta: patient.motivoConsulta || '',

    // Tipo de Entrega
    conInforme: tomografia.conInforme,
    sinInforme: tomografia.sinInforme,
    dicom: tomografia.dicom,
    soloUsb: tomografia.soloUsb,

    // Campo Pequeño
    endodoncia: tomografia.endodoncia,
    numeroPiezasEndo: tomografia.numeroPiezasEndo,
    fracturaRadicular: tomografia.fracturaRadicular,
    numeroPiezasFractura: tomografia.numeroPiezasFractura,
    anatomiaEndodontica: tomografia.anatomiaEndodontica,
    numeroPiezasAnatEndo: tomografia.numeroPiezasAnatEndo,

    // Campo Mediano
    localizacionDiente: tomografia.localizacionDiente,
    numeroPiezasLoc: tomografia.numeroPiezasLoc,
    implantes: tomografia.implantes,
    numeroCortes: tomografia.numeroCortes,
    conGuiaQx: tomografia.conGuiaQx,
    tipoGuiaImplante: tomografia.tipoGuiaImplante,
    maxilarSuperiorInferior: tomografia.maxilarSuperior,

    // Campo Grande
    viaAerea: tomografia.viaAerea,
    tipoGuiaViaAerea: tomografia.tipoGuiaViaAerea,
    ortognatica: tomografia.ortognatica,
    tipoOrtognatica: tomografia.tipoOrtognatica,

    // Ortodoncia
    ortodonciaMarpe: tomografia.marpe,
    ortodonciaMiniImplantes: tomografia.miniImplantes,
    ortodonciaIntraAlveolares: tomografia.intraAlveolares,
    ortodonciaExtraAlveolares: tomografia.extraAlveolares,
    ortodonciaInfracigomatico: tomografia.infracigomatico,
    ortodonciaBuccalShelf: tomografia.buccalShelf,
    tipoGuiaOrtodoncia: tomografia.tipoGuiaOrtodoncia,
    ortodonciaGuiaImpresa: tomografia.guiaImpresa,

    // Otras Opciones
    atm: tomografia.atm,
    tipoAtm: tomografia.tipoAtm,
    macizoFacial: tomografia.macizoFacial,
    tipoMacizoFacial: tomografia.tipoMacizoFacial,

    // Otros
    otros: tomografia.otros,

    // Datos del Odontólogo
    doctor: `${doctor.nombres} ${doctor.apellidos}`.trim(),
    cop: doctor.cop,
    direccion: doctor.direccion || '',
    email: doctor.email || '',
    telefonoDoctor: doctor.telefono || ''
  };
}

