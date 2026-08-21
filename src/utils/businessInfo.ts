export interface BusinessInfo {
  name: string;
  phone: string;
  address: string;
}

// Shown on bills and WhatsApp messages whenever the user hasn't turned on
// their own business info in Settings > Business Information.
export const DEFAULT_BUSINESS_INFO: Record<'en' | 'gu', BusinessInfo> = {
  en: {
    name: 'Khata Kendra',
    address: 'Blue City, Simada, Surat',
    phone: '88664 71567',
  },
  gu: {
    name: 'ખાતા કેન્દ્ર',
    address: 'બ્લુ સિટી, સીમાડા, સુરત',
    phone: '88664 71567',
  },
};

interface BusinessInfoSettings {
  useCustomBusinessInfo: boolean;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
}

/**
 * Resolves the business identity to print on bills / WhatsApp messages:
 * the user's own info (when enabled and a name has been entered), otherwise
 * the built-in default for the given app language.
 */
export const getBusinessInfo = (
  settings: BusinessInfoSettings,
  language: 'en' | 'gu'
): BusinessInfo => {
  if (settings.useCustomBusinessInfo && settings.businessName.trim()) {
    return {
      name: settings.businessName.trim(),
      phone: settings.businessPhone.trim(),
      address: settings.businessAddress.trim(),
    };
  }
  return DEFAULT_BUSINESS_INFO[language];
};
