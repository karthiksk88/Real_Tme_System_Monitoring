---
name: NeuroSys Management System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
  sidebar-collapsed: 72px
---

## Brand & Style
The design system is rooted in **Modern Minimalism** with a focus on technical precision and functional clarity. It is designed for high-density information environments where cognitive load must be minimized. The aesthetic is "Technical Professional"—it avoids decorative flourishes in favor of purposeful whitespace, crisp geometry, and a systematic approach to hierarchy.

The UI should feel like a high-performance tool: reliable, fast, and transparent. It utilizes a "Utility-First" visual language, where every element’s form is strictly dictated by its function in a computer lab management context.

## Colors
The palette is dominated by a systematic range of Slates to provide a neutral foundation that allows status-driven data to stand out. 

- **Primary Indigo:** Used strictly for primary actions and active states to maintain focus.
- **Surface Strategy:** Use `Slate 50` for the global background and `White` for interactive cards and containers to create a subtle but clear layered effect.
- **Semantic Clarity:** Status colors (Emerald, Amber, Rose) are reserved for system health indicators (e.g., node status, thermal alerts, or critical errors). They should always be paired with icons to ensure accessibility.

## Typography
This design system utilizes a dual-font strategy. **Geist** is used for headlines, labels, and technical data to provide a sharp, developer-centric feel. **Inter** is used for all body text to ensure maximum readability during long-form monitoring sessions.

- **Headlines:** Use tight letter spacing for a modern, "compacted" look.
- **Data Points:** For IP addresses, MAC addresses, or terminal outputs, utilize the monospaced alternates within the Geist family.
- **Labels:** Always uppercase or medium weight to distinguish from body content.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid model**. The sidebar is fixed, while the main content area utilizes a fluid grid that adapts to 12 columns on desktop.

- **Breakpoints:** Mobile (<640px), Tablet (640px - 1024px), Desktop (>1024px).
- **Sidebar:** On desktop, the sidebar is persistent. On tablet, it collapses to icons. On mobile, it transitions to a bottom navigation bar for key metrics and a hamburger menu for settings.
- **Density:** Use a tight 4px baseline grid. For data-heavy tables, reduce vertical padding to `8px` per row to maximize information density.

## Elevation & Depth
Depth is communicated through **Low-contrast outlines** rather than heavy shadows. This maintains a "flat" professional aesthetic that doesn't feel cluttered.

- **Level 0 (Background):** `Slate 50`.
- **Level 1 (Cards/Sidebar):** White background with a `1px` solid border in `Slate 200`.
- **Level 2 (Dropdowns/Modals):** White background with a `1px` border in `Slate 200` and a very soft, diffused shadow (`Y: 4, Blur: 12, Opacity: 0.05, Color: Slate 900`).
- **Interactive State:** Hovering over a card should change the border color to `Indigo 200` rather than increasing the shadow depth.

## Shapes
Shapes are disciplined and slightly "soft" to avoid the harshness of a purely industrial tool. 

- **Standard Radius:** `4px` (Small/Soft) for buttons, inputs, and tags.
- **Large Radius:** `8px` for cards and main container sections.
- **Interactive Elements:** Use the soft radius for all form components to create a cohesive, modern input experience.

## Components
### Buttons
- **Primary:** Solid `Indigo 600`, white text. No gradient.
- **Secondary:** White fill, `Slate 200` border, `Slate 900` text.
- **Danger:** Ghost style (red text) for low-risk actions; solid `Rose 600` for destructive actions.

### Status Indicators
- Use a "Dot + Label" pattern. The dot should pulse slightly for "Critical" or "Active" states to draw immediate attention.

### Tables
- Header rows should have a subtle `Slate 100` background.
- Use `Slate 200` for horizontal dividers only; avoid vertical dividers to keep the look clean.
- Alignment: Numbers and technical IDs should be right-aligned; text should be left-aligned.

### Data Displays
- **Skeleton Loaders:** Use a subtle pulse animation on `Slate 100` blocks.
- **Empty States:** Center-aligned with a simplified line-art icon in `Slate 300` and a clear call-to-action button.

### Inputs
- Height: Fixed `40px` for standard inputs.
- Focus State: `2px` outer glow in `Indigo 100` with an `Indigo 600` border.