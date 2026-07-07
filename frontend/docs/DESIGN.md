---
name: MinLish
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#56423f'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#89726e'
  outline-variant: '#dcc0bc'
  surface-tint: '#a03f35'
  primary: '#872d24'
  on-primary: '#ffffff'
  primary-container: '#a64439'
  on-primary-container: '#ffd7d2'
  inverse-primary: '#ffb4a9'
  secondary: '#055db6'
  on-secondary: '#ffffff'
  secondary-container: '#65a1fe'
  on-secondary-container: '#003670'
  tertiary: '#4d4b47'
  on-tertiary: '#ffffff'
  tertiary-container: '#65635f'
  on-tertiary-container: '#e3e0da'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#802820'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#a9c7ff'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#00468c'
  tertiary-fixed: '#e6e2dc'
  tertiary-fixed-dim: '#c9c6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#484743'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The brand personality is rooted in "warm minimalism"—a blend of editorial clarity and organic comfort. It targets a sophisticated audience that values intentionality over excess. The UI should evoke a sense of calm, precision, and high-end approachability.

The design style follows a **Modern Minimalist** movement with a **Tactile** twist. By utilizing a warm cream base instead of stark white, the design system avoids the sterility of traditional tech interfaces. It relies on generous whitespace, crisp typography, and purposeful pops of Deep Coral to guide the user's focus. Visual interest is generated through the juxtaposition of sharp editorial layouts and soft, pill-shaped interactive elements.

## Colors
The palette is built on a "New Heritage" foundation. 

- **Primary (Deep Coral):** Reserved strictly for high-priority actions and primary brand touchpoints. It provides a grounded, sophisticated warmth. In Dark Mode, this is shifted to a softer coral/peach tone (`#ffb4a9`) to maintain optimal contrast and a warm glow against dark backgrounds.
- **Secondary (Blue):** Used for utility-based highlights, inline links, and interactive states that require distinction from the primary brand color.
- **Surface (Cream):** The primary background color in Light Mode (`#fcf9f8`). It reduces eye strain and provides a premium, paper-like feel.
- **Neutral (Ink):** A near-black (`#1c1b1b`) for maximum legibility on cream surfaces in Light Mode.

Avoid using pure black (`#000000`) or pure white (`#FFFFFF`) to maintain the organic, high-end aesthetic.

### Theme Modes (Light & Dark)
The application dynamically toggles between Light and Dark themes via a global `ThemeContext`, changing CSS color variables through the `[data-theme='dark']` selector on the root element.

- **Dark Mode Background:** Built on a deep, warm dark charcoal (`#141212` for primary surface and `#0b0a0a` for lowest container) to preserve the "warm minimalism" vibe instead of a harsh pure black.
- **Dark Mode Foreground:** Text and outline colors are shifted to softer light tones (`#e6e1e1` for text, `#d8c2be` for variant details) to minimize glare and keep reading comfortable under low-light conditions.

## Typography
This design system uses **Inter** exclusively to ensure a systematic and utilitarian foundation that contrasts beautifully with the warm color palette. 

- **Headlines:** Must be bold and tight. Use "Display" for hero sections with slight negative letter spacing to create a high-impact, editorial look.
- **Body Text:** Focuses on legibility with a generous 1.6 line height. Use "Body-md" for general content and "Body-lg" for introductory paragraphs.
- **Labels:** Small caps or bold weights are used for eyebrow text and navigation items to create clear hierarchy without increasing size.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain editorial control over line lengths, transitioning to a **Fluid** model for mobile devices.

- **Grid:** Use a 12-column grid for desktop with 24px gutters.
- **Margins:** Desktop views should maintain a 64px safety margin, while mobile drops to 16px to maximize screen real estate.
- **Rhythm:** All spacing between elements should be increments of 4px. Use larger gaps (48px+) between major sections to emphasize the minimalist aesthetic.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows.

- **Surfaces:** Use subtle shifts in background color (e.g., a slightly darker cream or white) to define secondary containers.
- **Outlines:** Cards and input fields use a thin, 1px border in a muted neutral-brown tint to maintain structure without breaking the minimalist flow.
- **Shadows:** When necessary for floating elements like dropdowns, use a single, highly-diffused ambient shadow: `0 12px 32px rgba(166, 68, 57, 0.08)`. The shadow should carry a hint of the primary brand color to stay "on-palette."

## Shapes
The shape language is a strategic mix of soft geometry and perfect circles. 

- **Containers & Inputs:** Use a consistent 12px radius (`rounded-lg` in this system). This provides a friendly, modern structure to cards and text fields.
- **Interactive Elements:** Buttons and tags must be **Pill-shaped** (999px). This creates a clear visual distinction between "content containers" (rectangular) and "actionable items" (rounded).