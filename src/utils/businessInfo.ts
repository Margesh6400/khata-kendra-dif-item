export interface BusinessInfo {
  name: string;
  phone: string;
  address: string;
  subtitle?: string;
}

// Shown on bills and WhatsApp messages whenever the user hasn't turned on
// their own business info in Settings > Business Information.
export const DEFAULT_BUSINESS_INFO: Record<'en' | 'gu', BusinessInfo> = {
  en: {
    name: 'Khata Kendra',
    address: 'Blue City, Simada, Surat',
    phone: '88664 71567',
    subtitle: 'Jack Teka * Span * Plate * Jhula',
  },
  gu: {
    name: 'ખાતા કેન્દ્ર',
    address: 'બ્લુ સિટી, સીમાડા, સુરત',
    phone: '88664 71567',
    subtitle: 'જેક ટેકા * સ્પેન * પ્લેટ * ઝુલા',
  },
};

export interface BusinessInfoSettings {
  useCustomBusinessInfo: boolean;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  businessSubtitle?: string;
  enableCategoryBusinessInfo?: boolean;
  categoryBusinessInfo?: Record<string, Partial<BusinessInfo>>;
}

/**
 * Resolves the business identity to print on bills / WhatsApp messages:
 * checks category-specific overrides first if enabled, then general custom settings,
 * then falls back to default.
 */
export const getBusinessInfo = (
  settings: BusinessInfoSettings,
  language: 'en' | 'gu',
  category?: string | null
): BusinessInfo => {
  const defaultInfo = DEFAULT_BUSINESS_INFO[language];

  // If category-specific business info is enabled and a category is provided
  if (settings.enableCategoryBusinessInfo && category && settings.categoryBusinessInfo?.[category]) {
    const catInfo = settings.categoryBusinessInfo[category];
    if (catInfo.name && catInfo.name.trim()) {
      return {
        name: catInfo.name.trim(),
        phone: (catInfo.phone !== undefined ? catInfo.phone : (settings.businessPhone || defaultInfo.phone)).trim(),
        address: (catInfo.address !== undefined ? catInfo.address : (settings.businessAddress || defaultInfo.address)).trim(),
        subtitle: (catInfo.subtitle !== undefined ? catInfo.subtitle : (settings.businessSubtitle || defaultInfo.subtitle))?.trim() || defaultInfo.subtitle,
      };
    }
  }

  if (settings.useCustomBusinessInfo && settings.businessName.trim()) {
    return {
      name: settings.businessName.trim(),
      phone: settings.businessPhone.trim(),
      address: settings.businessAddress.trim(),
      subtitle: (settings.businessSubtitle !== undefined && settings.businessSubtitle.trim() !== '')
        ? settings.businessSubtitle.trim()
        : defaultInfo.subtitle,
    };
  }

  return defaultInfo;
};
