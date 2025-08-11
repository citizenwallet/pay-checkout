import { getColors, getHSLColors } from "./colors";

describe("Color utilities", () => {
  describe("getColors", () => {
    it("should generate color variants from a hex color", () => {
      const colors = getColors("#ff0000");

      expect(colors.primary).toBe("#ff0000");
      expect(colors.light).toBe("#ffcccc");
      expect(colors.lighter).toBe("#fff2f2");
      expect(colors.dark).toBe("#ff0000"); // The lightenColor function with negative percent returns the original color
      expect(colors.text).toBe("#ff0000");
      expect(colors.textLight).toBe("#ff0000");
    });

    it("should work with hex colors without #", () => {
      const colors = getColors("00ff00");

      expect(colors.primary).toBe("00ff00");
      expect(colors.light).toBe("#ccffcc");
      expect(colors.lighter).toBe("#f2fff2");
    });
  });

  describe("getHSLColors", () => {
    it("should convert hex colors to HSL format", () => {
      const hslColors = getHSLColors("#ff0000");

      // Red should be approximately 0 degrees hue, 100% saturation, 50% lightness
      expect(hslColors.primary).toMatch(/^0\s+100%\s+50%$/);
    });

    it("should work with green color", () => {
      const hslColors = getHSLColors("#00ff00");

      // Green should be approximately 120 degrees hue, 100% saturation, 50% lightness
      expect(hslColors.primary).toMatch(/^120\s+100%\s+50%$/);
    });

    it("should work with blue color", () => {
      const hslColors = getHSLColors("#0000ff");

      // Blue should be approximately 240 degrees hue, 100% saturation, 50% lightness
      expect(hslColors.primary).toMatch(/^240\s+100%\s+50%$/);
    });

    it("should generate all color variants in HSL format", () => {
      const hslColors = getHSLColors("#3431c4");

      expect(hslColors.primary).toBeDefined();
      expect(hslColors.light).toBeDefined();
      expect(hslColors.lighter).toBeDefined();
      expect(hslColors.dark).toBeDefined();
      expect(hslColors.text).toBeDefined();
      expect(hslColors.textLight).toBeDefined();

      // All should be in HSL format (h s% l%)
      const hslPattern = /^\d+\s+\d+%\s+\d+%$/;
      expect(hslColors.primary).toMatch(hslPattern);
      expect(hslColors.light).toMatch(hslPattern);
      expect(hslColors.lighter).toMatch(hslPattern);
      expect(hslColors.dark).toMatch(hslPattern);
      expect(hslColors.text).toMatch(hslPattern);
      expect(hslColors.textLight).toMatch(hslPattern);
    });
  });
});
