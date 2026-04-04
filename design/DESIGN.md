```markdown
# Design System Strategy: The Editorial Intelligence

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

While many flashcard tools feel like utilitarian spreadsheets, this system elevates the conversion of documents to knowledge into a premium, editorial experience. We are moving beyond the "SaaS template" by embracing **Soft Minimalism**. The interface should feel like a high-end physical workspace—vast white surfaces, intentional voids, and a sophisticated layering of materials. 

We reject the rigid "box-and-border" layout. Instead, we use **intentional asymmetry** and **tonal depth** to guide the eye. By utilizing varying surface containers and expansive negative space, we create a sense of calm authority, ensuring the user feels focused on the content, not the interface.

---

## 2. Color & Materiality
The palette is rooted in a pristine white foundation, energized by a singular, authoritative "Anki Blue" (`primary`).

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Boundaries are defined through **background color shifts**. For instance, a workspace section using `surface-container-low` sits directly on a `surface` background. This creates "soft edges" that feel integrated rather than partitioned.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f7f9fb)
- **Nested Workspace:** `surface-container-low` (#f2f4f6)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)

Nesting these tiers provides a natural, cognitive "lift" that identifies functional zones without cluttering the canvas with lines.

### The "Glass & Gradient" Rule
To inject "soul" into the professional aesthetic:
- **Primary Actions:** Use a subtle linear gradient from `primary` (#3525cd) to `primary_container` (#4f46e5) at a 135° angle.
- **Floating Modals/Settings:** Apply a `surface_container_lowest` background with 80% opacity and a `24px` backdrop-blur. This "frosted glass" effect ensures the interface feels light and modern.

---

## 3. Typography
We utilize **Inter** as a variable font to create a high-contrast hierarchy that mimics modern editorial design.

*   **Display & Headlines:** Use `display-md` for landing states and `headline-sm` for section headers. These should be set with a slightly tighter letter-spacing (-0.02em) to feel "locked-in" and authoritative.
*   **Body & Utility:** `body-md` is our workhorse. For secondary metadata or helper text, use `label-md` with `on_surface_variant` to recede visually.
*   **The Power of Scale:** Don't be afraid of the contrast between a `display-lg` welcome message and a `body-sm` caption. This "High-Low" typography is what separates high-end digital experiences from generic tools.

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration.

*   **The Layering Principle:** Rather than adding a shadow to a card, place a `surface-container-lowest` (pure white) card on top of a `surface-container-low` (pale grey) background. This creates a "Natural Lift."
*   **Ambient Shadows:** Use shadows only for floating elements (Tooltips, Popovers). Use a `0 20px 40px` blur at 4% opacity, using the `on_surface` color as the shadow base to simulate natural ambient light.
*   **The "Ghost Border" Fallback:** If a container must sit on a white background, use a "Ghost Border": `outline_variant` at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `xl` roundedness, white text. No border.
*   **Secondary:** `surface_container_high` background with `on_surface` text.
*   **Tertiary:** Transparent background, `primary` text. No border.

### Interactive Inputs
*   **Text Fields:** `surface_container_lowest` background with a subtle `outline_variant` (20% opacity) border. On focus, the border disappears and is replaced by a 2px `primary` bottom-glow.
*   **Upload Zone:** An expansive `surface_container_low` area with a dashed `outline_variant`. Use a `xl` corner radius. When a file is hovered, transition the background to `primary_fixed` (light indigo) for a tactile response.

### Editable Review Table (The Grid)
*   **The Row Rule:** Forbid 1px dividers between table rows. Instead, use `16px` of vertical white space. On hover, a row should subtly shift its background color to `surface_container_lowest` and apply a `xl` corner radius to the entire row-block.
*   **Skeleton Loaders:** Use a pulse animation transitioning between `surface_container` and `surface_container_high`. Keep the corners `xl` to match the component language.

### Modern Chips
*   **Action Chips:** Small, pill-shaped (`full` roundedness) using `secondary_fixed`. No borders. Used for card tags or status indicators.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Whitespace:** If a layout feels "off," add 24px of padding. Then add another 8px.
*   **Use Subtle Animation:** All state transitions (hover, focus, page shifts) should use a `cubic-bezier(0.4, 0, 0.2, 1)` easing over 200ms.
*   **Prioritize Hierarchy:** Use `on_surface` (near-black) for primary content and `on_surface_variant` (muted grey) for secondary instructions.

### Don't:
*   **Don't Use Pure Black Shadows:** This kills the "material" feel. Always use a tinted shadow.
*   **Don't Use Solid Dividers:** Avoid `<hr />` tags. Use background color shifts or empty space to separate content blocks.
*   **Don't Over-round Everything:** While `xl` is the standard for cards, smaller elements like checkboxes should stay at `sm` or `md` to maintain a professional, architectural sharpness.
*   **Don't Clutter the Header:** Keep the top-level navigation sparse. Use Lucide icons with a `2px` stroke weight for a clean, wireframe-like aesthetic.```