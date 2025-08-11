export interface Colors {
  primary: string;
  light: string;
  lighter: string;
  dark: string;
  text: string;
  textLight: string;
}

export interface HSLColors {
  primary: string;
  light: string;
  lighter: string;
  dark: string;
  text: string;
  textLight: string;
}

// Helper function to convert hex to HSL
const hexToHSL = (hex: string): string => {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
};

// Helper function to lighten a hex color
const lightenColor = (hex: string, percent: number) => {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate adjustment
  const factor = percent / 100;

  // Lighten or darken based on factor
  const newR = Math.round(Math.min(255, Math.max(0, r + (255 - r) * factor)));
  const newG = Math.round(Math.min(255, Math.max(0, g + (255 - g) * factor)));
  const newB = Math.round(Math.min(255, Math.max(0, b + (255 - b) * factor)));

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Create color variants
export const getColors = (cardColor: string): Colors => {
  return {
    primary: cardColor,
    light: lightenColor(cardColor, 80),
    lighter: lightenColor(cardColor, 95),
    dark: lightenColor(cardColor, -30),
    text: lightenColor(cardColor, -30),
    textLight: lightenColor(cardColor, -100),
  };
};

// Create HSL color variants for Tailwind
export const getHSLColors = (cardColor: string): HSLColors => {
  const colors = getColors(cardColor);
  return {
    primary: hexToHSL(colors.primary),
    light: hexToHSL(colors.light),
    lighter: hexToHSL(colors.lighter),
    dark: hexToHSL(colors.dark),
    text: hexToHSL(colors.text),
    textLight: hexToHSL(colors.textLight),
  };
};
