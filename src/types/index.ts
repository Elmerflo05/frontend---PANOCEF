// ✅ NUEVO: Interface para especialidades
export interface Specialty {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'doctor' | 'receptionist' | 'patient' | 'external_client' | 'imaging_technician' | 'prosthesis_technician';
  status: 'active' | 'inactive' | 'suspended';
  sedeId?: string;
  sedesAcceso?: string[];
  dentist_id?: number;
  patient_id?: number;
  branch_id?: number;
  profile: UserProfile;
  specialties?: Specialty[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionConfig {
  percentage: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  avatar?: string;
  patientId?: number;
  specialties?: string[];
  licenseNumber?: string;
  department?: string;
  commissionPercentage?: number;
  commissionConfig?: CommissionConfig;
}

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: 'M' | 'F' | 'O';
  address: string;
  medicalHistory: MedicalHistory;
  emergencyContact?: EmergencyContact;
  medicalRecordNumber?: string;
  isBasicRegistration?: boolean;
  completedAt?: Date;
  medicalInfoCompleted?: boolean;
  esClienteNuevo: boolean;
  companyId?: string;
  companyName?: string;
  healthPlan?: {
    id: number;
    name: string;
    code: string;
    type: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalHistory {
  allergies: string[];
  conditions: string[];
  medications: string[];
  bloodType: string;
  notes?: string;
  consultationReason?: string;
  medicalBackground?: {
    pathological: string[];
    previousDiseases: string[];
    previousOperations: string[];
    allergies: string[];
  };
  stomatologicalHistory?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending_approval' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'rejected';
  services: string[];
  notes?: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalAmount: number;
  type?: 'consultation' | 'imaging_study';
  imagingStudy?: ImagingStudy;
  rescheduleCount?: number;
  promotionApplied?: {
    promotionId: string;
    promotionName: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ImagingStudy {
  studyType: 'rayos_x' | 'panoramica' | 'tomografia' | 'cefalometria' | 'periapical' | 'oclusal';
  assignedTechnicianId?: string;
  studyStatus: 'pending' | 'completed' | 'delivered';
  requestedBy: string;
  findings?: string;
  images?: string[];
  completedAt?: Date;
  deliveredAt?: Date;
  technicianNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'payment' | 'lab_result' | 'system' | 'reminder' | 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'medium';
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

// Radiography Request Types (PanoCef)
export interface RadiographyRequest {
  id: string;
  requesterId: string;
  type: 'radiography';
  radiographyType?: string;
  status: 'pending' | 'price_pending' | 'price_approved' | 'completed' | 'delivered' | 'cancelled' | 'no_show';

  patientId?: string;
  medicalRecordId?: string;
  doctorId?: string;

  patientData: {
    nombre: string;
    edad?: string;
    dni: string;
    telefono?: string;
    motivoConsulta?: string;
  };

  doctorData: {
    doctor: string;
    cop?: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  };

  radiography: {
    intraorales?: IntraoralRadiography;
    extraorales?: ExtraoralRadiography;
    asesoriaOrtodoncia?: OrthodoticPackage;
    analisisCefalometricos?: string[];
  };

  pricing?: {
    breakdown: Array<{
      category: 'intraoral' | 'extraoral' | 'ortodoncias' | 'analisis';
      itemName: string;
      itemKey: string;
      basePrice: number;
      quantity?: number;
      subtotal: number;
    }>;

    suggestedPrice: number;
    finalPrice?: number;
    discount?: number;
    discountPercentage?: number;

    status: 'pending' | 'sent_to_client' | 'approved_by_client' | 'rejected_by_client';
    approvedBy?: string;
    approvedAt?: Date;
    clientApprovedAt?: Date;
    notes?: string;
  };

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  notes?: string;

  requestedDiscount?: boolean;
  externalLinks?: string[];
  images?: string[];
  reportDocuments?: string[];
  reportDocument?: string;
}

export interface IntraoralRadiography {
  tipo: ('periapical' | 'fisico' | 'digital')[];
  dientesSuperiores?: string[];
  dientesInferiores?: string[];
  dientesTemporales?: string[];
  bitewing?: {
    molares?: { derecha: boolean; izquierda: boolean };
    premolares?: { derecha: boolean; izquierda: boolean };
  };
  oclusal?: {
    superiores: boolean;
    inferiores: boolean;
  };
  seriada?: boolean;
  fotografiaIntraoral?: boolean;
  fotografiaExtraoral?: boolean;
}

export interface ExtraoralRadiography {
  tipo: ('fisico' | 'digital')[];
  estudios: {
    panoramica?: boolean;
    cefalometrica?: boolean;
    carpal?: boolean;
    carpalFishman?: boolean;
    carpalTtw2?: boolean;
    posteriorAnterior?: boolean;
    posteriorAnteriorRicketts?: boolean;
    atmBocaAbierta?: boolean;
    atmBocaCerrada?: boolean;
    fotografiaExtraoral?: boolean;
  };
}

export interface OrthodoticPackage {
  tipo: ('fisico' | 'digital')[];
  paquete?: 1 | 2 | 3;
  planTratamiento?: 'con' | 'sin' | '';
  alineadoresInvisibles?: boolean;
  alineadoresPlanificacion?: boolean;
  alineadoresImpresion?: boolean;
  escaneoBucal?: boolean;
  escaneoIntraoral?: boolean;
  escaneoIntraoralZocalo?: boolean;
  escaneoIntraoralInforme?: boolean;
  impresionDigital?: boolean;
  modelosDigitalesConInforme?: boolean;
  modelosDigitalesSinInforme?: boolean;
  modelosImpresionDigital?: boolean;
  conGuia?: 'con' | 'sin' | '';
  guiaImpresa?: 'impreso' | 'digital' | '';
}

export interface InventoryAlertSettings {
  diasAntes: number;
}

// Configuraciones Globales de la Aplicacion
export interface AppSettings {
  id: string;

  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  clinicLogo?: string;
  timezone: string;
  currency: string;
  language: string;

  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappImaging?: string;
  whatsappImagingDisplay?: string;
  phoneMain: string;
  phoneEmergency: string;
  emailInfo: string;
  emailAppointments: string;
  emailSupport: string;
  addressMain: string;

  facebook?: string;
  instagram?: string;
  twitter?: string;

  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  reminderTime: number;
  systemAlerts: boolean;

  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  auditLog: boolean;

  inventoryAlertSettings: InventoryAlertSettings;

  createdAt: Date;
  updatedAt: Date;
}

// Public Forms Types
export interface PublicForm {
  id: string;
  code: string;
  title: string;
  description?: string;
  createdBy: string;
  active: boolean;
  services: string[];
  requiredFields: FormFieldConfig[];
  optionalFields: FormFieldConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  options?: string[];
}

export interface PublicFormSubmission {
  id: string;
  formId: string;
  formCode: string;
  formTitle: string;
  status: 'nuevo' | 'contactado' | 'agendado' | 'completado' | 'archivado';

  formType?: 'simple' | 'radiography';

  data?: {
    nombre: string;
    telefono: string;
    email?: string;
    edad?: string;
    dni?: string;
    motivoConsulta?: string;
    serviciosSolicitados: string[];
    [key: string]: any;
  };

  radiographyData?: {
    patientData: {
      nombre: string;
      edad?: string;
      dni: string;
      telefono?: string;
      motivoConsulta?: string;
    };

    doctorData: {
      doctor: string;
      cop?: string;
      direccion?: string;
      email?: string;
      telefono?: string;
    };

    tomography?: {
      entregaSinInforme: boolean;
      entregaConInforme: boolean;
      entregaDicom: boolean;
      entregaUsb: boolean;
      campoEstudio: 'pequeno' | 'mediano' | 'grande';
      campoEstudioDetalle?: string;
    };

    radiography?: {
      intraorales?: IntraoralRadiography;
      extraorales?: ExtraoralRadiography;
      asesoriaOrtodoncia?: OrthodoticPackage;
      analisisCefalometricos?: string[];
    };
  };

  submittedAt: Date;
  contactedAt?: Date;
  contactedBy?: string;
  notes?: string;

  images?: string[];
  reportDocument?: string;
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}
