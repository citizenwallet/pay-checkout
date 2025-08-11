# Dynamic Colors Feature

This application supports dynamic color theming based on URL search parameters. The color is applied to the entire application, including the header, theme colors, and CSS custom properties that Tailwind CSS uses.

## How to Use

### 1. URL Parameter
Add a `color` parameter to any URL in the application:

```
https://yourapp.com?color=ff0000
https://yourapp.com/some-page?color=00ff00
https://yourapp.com/another-page?color=3431c4&search=something
```

### 2. Project Parameter (Legacy)
You can also use the `project` parameter to use predefined color mappings:

```
https://yourapp.com?project=class
https://yourapp.com?project=smile
```

### 3. Color Format
- Use hex colors without the `#` symbol
- Examples: `ff0000`, `00ff00`, `3431c4`, `8b5cf6`

### 4. Default Color
If no color parameter is provided, the application will use the default color: `#3431c4`

## Demo Page

Visit `/color-demo` to see the dynamic color system in action. This page allows you to:
- Select from predefined colors
- See how Tailwind's primary colors change
- View the CSS variables being updated
- Understand how the system works

## Implementation Details

### Files Modified/Created:
- `src/app/ColorProvider.tsx` - Client component that applies colors from URL parameters
- `src/utils/colors.ts` - Utility functions for color conversion and HSL generation
- `src/app/color-demo/page.tsx` - Demo page showcasing the dynamic colors
- `src/app/[accountOrUsername]/TopUp.tsx` - Updated to use dynamic primary colors

### How It Works:
1. **URL Parameter Detection**: The `ColorProvider` component reads the `color` or `project` search parameter from the URL
2. **Color Conversion**: Converts hex colors to HSL format for CSS custom properties
3. **CSS Variables**: Updates CSS custom properties for consistent theming
4. **Tailwind Integration**: Tailwind CSS uses these variables to generate utility classes

### CSS Variables Updated:
- `--primary` - Main brand color
- `--primary-foreground` - Text color on primary background
- `--accent` - Light variant of the primary color
- `--accent-foreground` - Text color on accent background
- `--secondary` - Lighter variant of the primary color
- `--secondary-foreground` - Text color on secondary background
- `--muted` - Very light variant of the primary color
- `--muted-foreground` - Dark text color for muted backgrounds
- `--ring` - Primary color for focus rings

### Meta Tags Updated:
- `theme-color` - For mobile browser theming
- `apple-mobile-web-app-status-bar-style` - For iOS web app status bar
- `apple-mobile-web-app-capable` - For iOS web app capabilities

## Example Usage

Visit these URLs to see different colors in action:
- `https://yourapp.com?color=ff0000` (Red)
- `https://yourapp.com?color=00ff00` (Green)
- `https://yourapp.com?color=ff6b35` (Orange)
- `https://yourapp.com?color=8b5cf6` (Purple)
- `https://yourapp.com?color=f59e0b` (Amber)
- `https://yourapp.com/color-demo` (Interactive demo)

The color will persist across page navigation within the same session and will be applied to all components that use the CSS custom properties.

## Technical Notes

- **Client-Side Implementation**: Uses React's `useEffect` to apply colors on the client side
- **HSL Conversion**: Colors are converted from hex to HSL format for better CSS variable support
- **Performance**: Colors are applied immediately when the component mounts
- **Compatibility**: Works with all modern browsers that support CSS custom properties
- **Fallback**: Gracefully falls back to default color when no parameter is provided
- **SEO Friendly**: Meta tags are updated dynamically for proper indexing

## Available Colors

### Predefined Project Colors:
- `default` - `#3431c4` (Blue)
- `class` - `#ec6825` (Orange)
- `smile` - `#449197` (Teal)

### Custom Colors:
Any hex color can be used by adding `?color=HEXCODE` to the URL.
