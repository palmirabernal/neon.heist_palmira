---
name: skycast
colors:
  surface: '#fff8f7'
  surface-dim: '#ffcfc9'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ee'
  surface-container: '#ffe9e6'
  surface-container-high: '#ffe2de'
  surface-container-highest: '#ffdad5'
  on-surface: '#2e1411'
  on-surface-variant: '#554242'
  inverse-surface: '#472825'
  inverse-on-surface: '#ffedea'
  outline: '#887272'
  outline-variant: '#dbc0c0'
  surface-tint: '#9c4048'
  primary: '#9c4048'
  on-primary: '#ffffff'
  primary-container: '#bb585f'
  on-primary-container: '#140002'
  inverse-primary: '#ffb3b5'
  secondary: '#3a646f'
  on-secondary: '#ffffff'
  secondary-container: '#bbe7f3'
  on-secondary-container: '#3f6973'
  tertiary: '#006875'
  on-tertiary: '#ffffff'
  tertiary-container: '#008393'
  on-tertiary-container: '#000607'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b5'
  on-primary-fixed: '#40000b'
  on-primary-fixed-variant: '#7e2932'
  secondary-fixed: '#beeaf6'
  secondary-fixed-dim: '#a2ceda'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#214c57'
  tertiary-fixed: '#9defff'
  tertiary-fixed-dim: '#50d7ed'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f59'
  background: '#fff8f7'
  on-background: '#2e1411'
  surface-variant: '#ffdad5'
typography:
  display-hero:
    fontFamily: Be Vietnam Pro
    fontSize: 5rem
    fontWeight: '300'
    lineHeight: 5rem
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 3.75rem
    fontWeight: '300'
    lineHeight: 3.75rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 1.5rem
    fontWeight: '400'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-md:
    fontFamily: Bricolage Grotesque
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Courier Prime
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Courier Prime
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
  space-2xl: 3.5rem
---

## Brand & Style
The design system embodies an expressive, atmospheric clarity inspired by modern consumer hardware interfaces and ambient meteorological forecasts. The design aesthetic is ethereal minimalism with warm tactile qualities: pure luminous whites, diffused rose and petal pink light fields, ultra-refined frosted glass surfaces, and whisper-quiet typography. 

The aesthetic is strictly lowercase across all titles, metrics, actions, and subheadings, creating an intimate, poetic, and non-intrusive emotional tone. The interface feels weightless, breathable, and deeply considered, avoiding high visual noise or harsh contrast in favor of soft ambient balance and immediate atmospheric legibility.

## Colors
The palette balances pure light with soft atmospheric warmth. 

- **Canvas & Gradients**: Base background is pure white (`#ffffff`) layered with smooth, large-radius radial and conic gradients featuring blush rose and warm amber highlights at 15–30% opacity to mimic diffused sunrise and golden-hour skies.
- **Surfaces**: Crisp white panels (`#ffffff`) at 70% to 85% opacity over frosted backdrops, accented with soft white inner highlights (`rgba(255, 255, 255, 0.8)`).
- **Text & Contrasts**: Primary copy uses deep muted slate (`#956d68`) for effortless legibility without the harshness of pure black. Secondary data, timestamps, and contextual labels utilize soft slate grey (`#64748b` and `#94a3b8`).
- **Accents**: Expressive rose (`#bb585f`), teal secondary (`#537d88`), and vibrant cyan (`#0cb3c8`) highlight critical dynamic metrics, current hour indicators, UV index peaks, and interactive states.

## Typography
All headings, status texts, metrics, and navigation items are rendered strictly in lowercase (e.g., `los angeles`, `mostly clear`, `humidity`, `72°`). 

Typography relies on Be Vietnam Pro for headlines, Bricolage Grotesque for body copy, and Courier Prime for labels and metadata, establishing a crisp, modern, yet technical editorial restraint.

## Layout & Spacing
The layout follows a fluid, responsive 12-column structure centered within an adaptive maximum container width of 1120px. 

- **Mobile (<640px)**: 4-column flow with 1rem outer margin and 1rem gutter. Content stacks vertically into full-width modular glass tiles and horizontal scrolling pill tracks.
- **Tablet (640px–1024px)**: 8-column layout with 2rem margins, pairing the primary forecast card alongside 2-column metric cards.
- **Desktop (>1024px)**: 12-column layout with 3.5rem margins, separating the canvas into a dominant current weather focus panel (5 columns) and an aggregated multi-metric grid (7 columns).

Whitespace is preserved deliberately: empty vertical space between primary modules is expansive (`space-2xl`), evoking the calm atmosphere of an open horizon.

## Elevation & Depth
Depth is created through luminous surface transparency, frosted glass backdrops, and feather-soft ambient shadows:

- **Surface Translucency**: Glass layers utilize `backdrop-filter: blur(24px)` combined with background fills of `rgba(255, 255, 255, 0.72)`.
- **Inner Rim Lighting**: Every card and container is encased in a dual perimeter structure—an exterior micro-border of `rgba(255, 255, 255, 0.6)` and an inner highlight inset shadow `inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)`.
- **Soft Ambient Shadows**: Never use heavy directional drop shadows. Base elevation uses a diffuse glow: `0 8px 32px -4px rgba(187, 88, 95, 0.06), 0 4px 16px -2px rgba(149, 109, 104, 0.03)`. Higher-state active overlays scale this to `0 16px 48px -8px rgba(83, 125, 136, 0.12)`.

## Shapes
Shapes adhere to soft, refined curves resembling modern clean-tech hardware corner radii. 

- **Primary Cards & Containers**: Use softer corner radii (`rounded-xl` / 0.75rem to 1rem) for a crisp, structured container shape.
- **Interactive Metrics, Inputs & Pills**: Use full pill radii (`rounded-full`) for badges, tab items, search fields, and hourly forecast items.
- **Interior Sub-modules**: Use tighter soft rounding (`rounded-lg` / 0.5rem) when nesting data clusters inside parent cards.

## Components

### Surface Cards & Modules
- **Metric Cards (UV, Wind, Humidity, Air Quality)**: Built on frosted translucent white surfaces with `backdrop-filter: blur(24px)`. Include a lowercase muted label at the top (`label-sm`), prominent centered metric value (`headline-lg`), and an atmospheric micro-graph or progress meter rendered in vibrant gradient fills.
- **Hourly Forecast Track**: A horizontally swipeable card containing continuous pill slots. The active/current hour is encapsulated in a soft solid white pill with delicate accent text, while inactive hours display muted grey typography and line icons.

### Buttons & Interactive Controls
- **Primary Buttons**: Capsule pills (`rounded-full`) filled with a soft vibrant blend (`linear-gradient(135deg, #bb585f, #537d88)`) and pure white lowercase text (`label-md`). Hover states trigger a subtle warm ambient bloom shadow.
- **Secondary / Segmented Pills**: Transparent white pill containers with `backdrop-filter: blur(16px)` and faint white borders. Selected segments toggle to solid white with tinted text.

### Search & Input Fields
- Floating pill-shaped input with a frosted glass surface (`rgba(255, 255, 255, 0.85)`).
- Prefix weather search icon in muted slate (`#94a3b8`).
- Placeholder text in lowercase (`"search city or airport..."`) set in `body-md` slate.

### Chips & Badges
- Ultra-compact rounded pills with `0.25rem` vertical and `0.75rem` horizontal padding.
- Color variations reflect environmental conditions: subtle accent tints for air quality alerts, soft pastel highlights for temperature highs, and crisp white glass for general status indicators.

### Iconography & Celestial Graphics
- Thin stroke weights (1.25px to 1.5px) matching typography stems.
- Clean vector suns, clouds, and droplets rendered in warm duotone: glowing accents paired with slate outlines.