/**
 * Fuente única de verdad para construir el desglose de precios
 * de una solicitud de radiografía (tomografía + radiografías + análisis cefalométricos).
 *
 * Este util se usa en:
 *   - SetPriceModal (técnico edita precios)
 *   - RequestDetailsModal (técnico/admin ve detalle)
 *   - Exportaciones (PDF, Excel) si necesitan el total
 *
 * La lógica:
 *   1. Normaliza los items existentes del `pricing_data.breakdown` (formato nuevo o antiguo).
 *   2. Detecta qué exámenes están marcados en `request_data` y no tienen item en el breakdown,
 *      y los agrega con el precio vigente desde los hooks de precios configurados.
 *   3. Devuelve una lista unificada ordenada por categoría.
 *
 * Total de la solicitud: siempre es la suma de (price * quantity) sobre la lista unificada,
 * salvo que exista `pricing_data.finalPrice` (que es una sobre-escritura explícita del técnico).
 */

export type BreakdownCategory =
  | 'tomografia3D'
  | 'intraoral'
  | 'extraoral'
  | 'ortodoncias'
  | 'analisis'
  | 'fotografias'
  | 'general';

export interface NormalizedBreakdownItem {
  category: BreakdownCategory;
  itemName: string;
  itemKey: string;
  price: number;
  quantity: number;
}

/**
 * Precios de Tomografía 3D como los expone el hook `useTomografia3DPricing`.
 */
export type Tomografia3DPricing = Record<string, number | undefined | null> | null | undefined;

/**
 * Precios de Radiografías como los expone el hook `useRadiografiasPricing`.
 */
export type RadiografiasPricing = Record<string, number | undefined | null> | null | undefined;

interface StoredBreakdownItemLegacy {
  service?: string;
  price?: number;
  quantity?: number;
  subtotal?: number;
  category?: string;
}

interface StoredBreakdownItemNew {
  itemName?: string;
  itemKey?: string;
  category?: string;
  basePrice?: number;
  price?: number;
  quantity?: number;
  subtotal?: number;
}

export type StoredBreakdownItem = StoredBreakdownItemLegacy & StoredBreakdownItemNew;

/**
 * Deduce la categoría de un item de formato antiguo a partir de su nombre de servicio.
 */
const inferCategoryFromService = (service: string): BreakdownCategory => {
  const s = (service || '').toLowerCase();
  if (
    s.includes('tomografía') || s.includes('tomografia') || s.includes('usb') || s.includes('dicom') ||
    s.includes('informe') || s.includes('atm') || s.includes('macizo') || s.includes('marpe') ||
    s.includes('implante') || s.includes('endodoncia') || s.includes('vía aérea') || s.includes('ortognática')
  ) {
    return 'tomografia3D';
  }
  if (s.includes('fotografía') || s.includes('fotografia') || s.includes('foto')) return 'fotografias';
  if (s.includes('periapical') || s.includes('bitewing') || s.includes('oclusal') || s.includes('seriada')) return 'intraoral';
  if (
    s.includes('panorámica') || s.includes('panoramica') || s.includes('cefalométrica') || s.includes('cefalometrica') ||
    s.includes('carpal') || s.includes('posterior')
  ) {
    return 'extraoral';
  }
  if (s.includes('paquete') || s.includes('ortodoncia') || s.includes('asesoría') || s.includes('asesoria')) return 'ortodoncias';
  if (
    s.includes('análisis') || s.includes('analisis') || s.includes('ricketts') || s.includes('steiner') ||
    s.includes('mcnamara') || s.includes('bjork') || s.includes('usp') || s.includes('schwartz') ||
    s.includes('tweed') || s.includes('downs') || s.includes('jarabak') || s.includes('tejidos')
  ) {
    return 'analisis';
  }
  return 'general';
};

/**
 * Normaliza un item del breakdown stored en BD (formato nuevo o legacy) al formato unificado.
 */
export const normalizeStoredBreakdownItem = (item: StoredBreakdownItem): NormalizedBreakdownItem => {
  // Formato nuevo: itemName + itemKey + basePrice
  if (item.itemName) {
    const basePrice = typeof item.basePrice === 'number' ? item.basePrice : (item.price ?? 0);
    return {
      category: (item.category as BreakdownCategory) || 'general',
      itemName: item.itemName,
      itemKey: item.itemKey || item.itemName.toLowerCase().replace(/\s+/g, '_'),
      price: basePrice,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1
    };
  }
  // Formato antiguo: { service, price }
  return {
    category: inferCategoryFromService(item.service || 'Servicio'),
    itemName: item.service || 'Servicio sin nombre',
    itemKey: (item.service || 'servicio').toLowerCase().replace(/\s+/g, '_'),
    price: item.price ?? 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1
  };
};

/**
 * Número positivo o cero; útil para resolver precios opcionales de los hooks.
 */
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Normaliza un nombre de servicio para comparaciones robustas:
 *   - minúsculas
 *   - sin acentos
 *   - sin espacios al inicio/fin
 *   - espacios colapsados
 * Usado para detectar duplicados entre el breakdown legacy (guardado por
 * DiagnosticPlanStep con nombres "Tomografía 3D sin Informe") y los items
 * regenerados con nombre canónico ("Sin Informe").
 */
const normalizeForMatching = (s: string | undefined): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Prefijos de categoría que el doctor añade al nombre ("Tomografía 3D sin Informe" → "sin Informe")
    .replace(/tomografia\s*3d\s*/g, ' ')
    .replace(/radiografia[s]?\s*/g, ' ')
    .replace(/analisis\s*/g, ' ')
    // Paréntesis y contenido entre paréntesis ("ATM (Tomografía)" → "ATM")
    .replace(/\([^)]*\)/g, ' ')
    // Separadores no-alfanuméricos a espacios
    .replace(/[^a-z0-9\s]/g, ' ')
    // Stop words en español que no aportan a la identidad del item.
    // "con" y "sin" se preservan porque diferencian items (p. ej. "Con Informe" vs "Sin Informe").
    .replace(/\b(de|del|la|el|los|las|y|o|a|en)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Agrega items desde `request_data` que no estén ya en `existingKeys` ni por
 * nombre normalizado (para compatibilidad con breakdowns legacy).
 */
const generateItemsFromRequestData = (
  requestData: any,
  existingKeys: Set<string>,
  existingNames: Set<string>,
  tomografiaPricing: Tomografia3DPricing,
  radiografiasPricing: RadiografiasPricing
): NormalizedBreakdownItem[] => {
  const alreadyPresent = (itemKey: string, itemName: string) =>
    existingKeys.has(itemKey) || existingNames.has(normalizeForMatching(itemName));
  const items: NormalizedBreakdownItem[] = [];
  const tomografia3D = requestData?.tomografia3D || {};
  const radiografias = requestData?.radiografias || {};

  const addIfBool = (
    source: any,
    field: string,
    category: BreakdownCategory,
    itemName: string,
    itemKey: string,
    priceKey: string,
    pricing: Tomografia3DPricing | RadiografiasPricing,
    quantity = 1
  ) => {
    if (source?.[field] === true && !alreadyPresent(itemKey, itemName)) {
      items.push({
        category,
        itemName,
        itemKey,
        price: num((pricing as any)?.[priceKey]),
        quantity
      });
    }
  };

  // === TOMOGRAFÍA 3D ===
  const tomografiaFields: Array<[string, string]> = [
    ['conInforme', 'Con Informe'],
    ['sinInforme', 'Sin Informe'],
    ['dicom', 'DICOM'],
    ['soloUsb', 'Solo USB'],
    ['endodoncia', 'Endodoncia'],
    ['fracturaRadicular', 'Fractura Radicular'],
    ['anatomiaEndodontica', 'Anatomía Endodóntica'],
    ['localizacionDiente', 'Localización de Diente'],
    ['implantes', 'Implantes'],
    ['maxilarSuperior', 'Maxilar Superior'],
    ['viaAerea', 'Vía Aérea'],
    ['ortognatica', 'Ortognática'],
    ['marpe', 'MARPE'],
    ['miniImplantes', 'Mini-implantes'],
    ['atm', 'ATM'],
    ['macizoFacial', 'Macizo Facial']
  ];
  for (const [field, name] of tomografiaFields) {
    addIfBool(tomografia3D, field, 'tomografia3D', name, field, field, tomografiaPricing);
  }

  // === RADIOGRAFÍAS INTRAORALES ===
  const periapicalFisico: string[] = radiografias.periapicalFisico || [];
  if (periapicalFisico.length > 0 && !alreadyPresent('periapicalFisico', 'Periapical Físico')) {
    items.push({
      category: 'intraoral',
      itemName: 'Periapical Físico',
      itemKey: 'periapicalFisico',
      price: num((radiografiasPricing as any)?.periapicalFisico),
      quantity: periapicalFisico.length
    });
  }
  const periapicalDigital: string[] = radiografias.periapicalDigital || [];
  if (periapicalDigital.length > 0 && !alreadyPresent('periapicalDigital', 'Periapical Digital')) {
    items.push({
      category: 'intraoral',
      itemName: 'Periapical Digital',
      itemKey: 'periapicalDigital',
      price: num((radiografiasPricing as any)?.periapicalDigital),
      quantity: periapicalDigital.length
    });
  }

  // Bitewing: cuenta cuadrantes marcados
  const bitewingCount = [
    radiografias.bitewingMolaresDerecha,
    radiografias.bitewingMolaresIzquierda,
    radiografias.bitewingPremolaresDerecha,
    radiografias.bitewingPremolaresIzquierda
  ].filter(Boolean).length;
  if (bitewingCount > 0 && !alreadyPresent('bitewingAmbos', 'Bitewing') && !alreadyPresent('bitewingIndividual', 'Bitewing')) {
    if (bitewingCount >= 2) {
      items.push({
        category: 'intraoral',
        itemName: 'Bitewing (Ambos)',
        itemKey: 'bitewingAmbos',
        price: num((radiografiasPricing as any)?.bitewingAmbos),
        quantity: 1
      });
    } else {
      items.push({
        category: 'intraoral',
        itemName: 'Bitewing (Individual)',
        itemKey: 'bitewingIndividual',
        price: num((radiografiasPricing as any)?.bitewingDerecho || (radiografiasPricing as any)?.bitewingIzquierdo),
        quantity: 1
      });
    }
  }

  const intraoralFields: Array<[string, string]> = [
    ['oclusalSuperiores', 'Oclusal Superiores'],
    ['oclusalInferiores', 'Oclusal Inferiores'],
    ['seriada', 'Seriada']
  ];
  for (const [field, name] of intraoralFields) {
    addIfBool(radiografias, field, 'intraoral', name, field, field, radiografiasPricing);
  }

  // === FOTOGRAFÍAS ===
  addIfBool(radiografias, 'fotografias', 'fotografias', 'Fotografías', 'fotografias', 'radiografias', radiografiasPricing);
  addIfBool(radiografias, 'fotografiaIntraoral', 'fotografias', 'Fotografía Intraoral', 'fotografiaIntraoral', 'fotografiaIntraoral', radiografiasPricing);
  addIfBool(radiografias, 'fotografiaExtraoral', 'fotografias', 'Fotografía Extraoral', 'fotografiaExtraoral', 'fotografiaExtraoral', radiografiasPricing);

  // === EXTRAORALES ===
  const extraoralFields: Array<[string, string, string, string]> = [
    ['extraoralPanoramica', 'Panorámica', 'panoramica', 'halografiaPanoramica'],
    ['extraoralCefalometrica', 'Cefalométrica', 'cefalometrica', 'radiografiaCefalometrica'],
    ['extraoralCarpal', 'Carpal', 'carpal', 'halografiaLateral'],
    ['extraoralPosteriorAnterior', 'Posterior-Anterior', 'posterioranterior', 'halografiaPosterior']
  ];
  for (const [field, name, key, priceKey] of extraoralFields) {
    if (radiografias?.[field] === true && !alreadyPresent(key, name)) {
      items.push({
        category: 'extraoral',
        itemName: name,
        itemKey: key,
        price: num((radiografiasPricing as any)?.[priceKey]),
        quantity: 1
      });
    }
  }
  if (
    (radiografias.extraoralAtmAbierta === true || radiografias.extraoralAtmCerrada === true) &&
    !alreadyPresent('estudiosAtm', 'Estudios ATM')
  ) {
    items.push({
      category: 'extraoral',
      itemName: 'Estudios ATM',
      itemKey: 'estudiosAtm',
      price: num((radiografiasPricing as any)?.estudiosAtm),
      quantity: 1
    });
  }

  // === ORTODONCIA ===
  const paquete = Number(radiografias.ortodonciaPaquete || 0);
  const conAsesoria = radiografias.ortodonciaPlanTratamiento === 'con';
  const paqueteKeys: Record<number, [string, string]> = {
    1: [conAsesoria ? 'paq1ConAsesoria' : 'paq1SinAsesoria', `Paquete 1 ${conAsesoria ? 'con' : 'sin'} Asesoría`],
    2: [conAsesoria ? 'paq2ConAsesoria' : 'paq2SinAsesoria', `Paquete 2 ${conAsesoria ? 'con' : 'sin'} Asesoría`],
    3: [conAsesoria ? 'paq3ConAsesoria' : 'paq3SinAsesoria', `Paquete 3 ${conAsesoria ? 'con' : 'sin'} Asesoría`]
  };
  if (paquete > 0 && paqueteKeys[paquete]) {
    const [key, name] = paqueteKeys[paquete];
    if (!alreadyPresent(key, name)) {
      items.push({
        category: 'ortodoncias',
        itemName: name,
        itemKey: key,
        price: num((radiografiasPricing as any)?.[key]),
        quantity: 1
      });
    }
  }
  addIfBool(radiografias, 'ortodonciaAlineadores', 'ortodoncias', 'Alineadores Invisibles', 'alineadores', 'alteracionesInmediatas', radiografiasPricing);
  addIfBool(radiografias, 'ortodonciaEscaneo', 'ortodoncias', 'Escaneo Intraoral Digital', 'escaneoDigital', 'escaneoImpresionDigital', radiografiasPricing);
  addIfBool(radiografias, 'ortodonciaImpresion', 'ortodoncias', 'Modelos de Estudio 3D', 'modelos3d', 'modelosEstudio3d', radiografiasPricing);

  // === ANÁLISIS CEFALOMÉTRICOS ===
  const analisisFields: Array<[string, string, string]> = [
    ['analisisRicketts', 'Análisis Ricketts', 'ricketts'],
    ['analisisSteiner', 'Análisis Steiner', 'steiner'],
    ['analisisMcNamara', 'Análisis McNamara', 'mcNamara'],
    ['analisisBjorks', 'Análisis Bjork', 'bjork'],
    ['analisisUSP', 'Análisis USP', 'usp'],
    ['analisisSchwartz', 'Análisis Schwartz', 'schwartz'],
    ['analisisTweed', 'Análisis Tweed', 'tweed'],
    ['analisisDowns', 'Análisis Downs', 'downs'],
    ['analisisRotJarabak', 'Análisis Rot Jarabak', 'rotJarabak'],
    ['analisisTejidosBlancos', 'Análisis Tejidos Blandos', 'tejidosBlancos']
  ];
  for (const [field, name, priceKey] of analisisFields) {
    if (radiografias?.[field] === true && !alreadyPresent(priceKey, name)) {
      items.push({
        category: 'analisis',
        itemName: name,
        itemKey: priceKey,
        price: num((radiografiasPricing as any)?.[priceKey]),
        quantity: 1
      });
    }
  }

  return items;
};

/**
 * Fuente única: construye el desglose de precios combinando el breakdown guardado en BD
 * con los items regenerados desde `request_data` (para cubrir gaps de saves antiguos).
 *
 * Orden del resultado: primero los items ya guardados (respetando su orden), luego los nuevos.
 */
export const buildBreakdown = (
  storedBreakdown: StoredBreakdownItem[] | null | undefined,
  requestData: any,
  tomografiaPricing: Tomografia3DPricing,
  radiografiasPricing: RadiografiasPricing
): NormalizedBreakdownItem[] => {
  const normalized: NormalizedBreakdownItem[] = [];
  const existingKeys = new Set<string>();
  const existingNames = new Set<string>();

  for (const item of storedBreakdown || []) {
    const n = normalizeStoredBreakdownItem(item);
    normalized.push(n);
    existingKeys.add(n.itemKey);
    existingNames.add(normalizeForMatching(n.itemName));
  }

  if (requestData) {
    normalized.push(
      ...generateItemsFromRequestData(requestData, existingKeys, existingNames, tomografiaPricing, radiografiasPricing)
    );
  }

  return normalized;
};

/**
 * Construye el desglose COMPLETO directamente desde los datos del formulario del doctor
 * (sin partir de un breakdown previo). Útil al momento de guardar desde DiagnosticPlanStep
 * para dejar `pricing_data.breakdown` canónico en BD y eliminar dependencia de formato legacy.
 */
export const buildBreakdownFromFormData = (
  requestData: any,
  tomografiaPricing: Tomografia3DPricing,
  radiografiasPricing: RadiografiasPricing
): NormalizedBreakdownItem[] => {
  if (!requestData) return [];
  return generateItemsFromRequestData(requestData, new Set(), new Set(), tomografiaPricing, radiografiasPricing);
};

/**
 * Total de una lista de items. Siempre suma subtotales (price * quantity).
 * No aplica overrides: el consumidor decide si mostrar este total calculado o un
 * `finalPrice` fijado explícitamente por el técnico.
 */
export const computeBreakdownTotal = (items: NormalizedBreakdownItem[]): number => {
  return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
};

/**
 * Etiqueta legible para cada categoría.
 */
export const getCategoryLabel = (category: BreakdownCategory | string): string => {
  const labels: Record<string, string> = {
    tomografia: 'Tomografía 3D',
    tomografia3D: 'Tomografía 3D',
    intraoral: 'Radiografías Intraorales',
    extraoral: 'Radiografías Extraorales',
    ortodoncias: 'Asesoría Ortodoncia',
    analisis: 'Análisis Cefalométricos',
    fotografias: 'Fotografías',
    general: 'Servicio'
  };
  return labels[category] || category;
};
