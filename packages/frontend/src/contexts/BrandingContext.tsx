import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface BrandingConfig {
  organizationName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  loading: boolean;
}

const defaultBranding: BrandingConfig = {
  organizationName: 'DR Assessment Tool',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.ico',
  primaryColor: '#0066CC',
  secondaryColor: '#333333',
  accentColor: '#FF6600',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: false
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        // Get current domain
        const domain = window.location.hostname;

        // Try to fetch branding for this domain (public endpoint)
        const response = await api.get(`/branding/domain/${domain}`);
        const brandingData = response.data.data;

        setBranding({
          ...defaultBranding,
          ...brandingData
        });

        // Apply branding to document
        applyBranding(brandingData);
      } catch (error) {
        // Use default branding if fetch fails
        console.log('Using default branding');
        applyBranding(defaultBranding);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  const applyBranding = (config: BrandingConfig) => {
    // Update document title
    document.title = config.organizationName;

    // Update favicon
    if (config.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      (link as HTMLLinkElement).type = 'image/x-icon';
      (link as HTMLLinkElement).rel = 'shortcut icon';
      (link as HTMLLinkElement).href = config.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', config.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', config.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', config.accentColor);
    document.documentElement.style.setProperty('--font-family', config.fontFamily);
  };

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};
