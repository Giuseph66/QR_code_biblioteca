import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ThemeColors {
  // Light theme
  light_background: string;
  light_foreground: string;
  light_card: string;
  light_card_foreground: string;
  light_primary: string;
  light_primary_foreground: string;
  light_secondary: string;
  light_secondary_foreground: string;
  light_muted: string;
  light_muted_foreground: string;
  light_accent: string;
  light_accent_foreground: string;
  light_border: string;
  
  // Dark theme
  dark_background: string;
  dark_foreground: string;
  dark_card: string;
  dark_card_foreground: string;
  dark_primary: string;
  dark_primary_foreground: string;
  dark_secondary: string;
  dark_secondary_foreground: string;
  dark_muted: string;
  dark_muted_foreground: string;
  dark_accent: string;
  dark_accent_foreground: string;
  dark_border: string;
  
  // Button colors
  light_button_primary: string;
  light_button_primary_foreground: string;
  light_button_secondary: string;
  light_button_secondary_foreground: string;
  dark_button_primary: string;
  dark_button_primary_foreground: string;
  dark_button_secondary: string;
  dark_button_secondary_foreground: string;
}

export const useThemeConfig = () => {
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);

  useEffect(() => {
    loadThemeConfig();
  }, []);

  const loadThemeConfig = async () => {
    try {
      const { data } = await supabase
        .from('theme_config')
        .select('*')
        .is('session_id', null)
        .maybeSingle();

      if (data) {
        setThemeColors(data as ThemeColors);
        applyTheme(data as ThemeColors);
      }
    } catch (error) {
      console.error('Error loading theme config:', error);
    }
  };

  const applyTheme = (colors: ThemeColors) => {
    // Create a style element to inject CSS with proper dark mode support
    let styleElement = document.getElementById('custom-theme-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-theme-styles';
      document.head.appendChild(styleElement);
    }

    // Build CSS with both light and dark theme rules
    const css = `
      :root {
        --background: ${colors.light_background};
        --foreground: ${colors.light_foreground};
        --card: ${colors.light_card};
        --card-foreground: ${colors.light_card_foreground};
        --primary: ${colors.light_button_primary || colors.light_primary};
        --primary-foreground: ${colors.light_button_primary_foreground || colors.light_primary_foreground};
        --secondary: ${colors.light_button_secondary || colors.light_secondary};
        --secondary-foreground: ${colors.light_button_secondary_foreground || colors.light_secondary_foreground};
        --muted: ${colors.light_muted};
        --muted-foreground: ${colors.light_muted_foreground};
        --accent: ${colors.light_accent};
        --accent-foreground: ${colors.light_accent_foreground};
        --border: ${colors.light_border};
      }

      .dark {
        --background: ${colors.dark_background};
        --foreground: ${colors.dark_foreground};
        --card: ${colors.dark_card};
        --card-foreground: ${colors.dark_card_foreground};
        --primary: ${colors.dark_button_primary || colors.dark_primary};
        --primary-foreground: ${colors.dark_button_primary_foreground || colors.dark_primary_foreground};
        --secondary: ${colors.dark_button_secondary || colors.dark_secondary};
        --secondary-foreground: ${colors.dark_button_secondary_foreground || colors.dark_secondary_foreground};
        --muted: ${colors.dark_muted};
        --muted-foreground: ${colors.dark_muted_foreground};
        --accent: ${colors.dark_accent};
        --accent-foreground: ${colors.dark_accent_foreground};
        --border: ${colors.dark_border};
      }
    `;

    styleElement.textContent = css;
  };

  return { themeColors, loadThemeConfig, applyTheme };
};
