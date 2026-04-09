# Sage & Stone Editorial Design System
 
### 1. Overview & Creative North Star
**Creative North Star: The Curated Gallery**
Sage & Stone is a design system built for discovery and distinction. It moves away from the "app-like" density of traditional SaaS and towards the quiet confidence of a high-end editorial journal. The system prioritizes breathing room, sophisticated serif-driven hierarchies, and a tonal palette that feels organic rather than synthetic.
 
The aesthetic philosophy centers on **Intentional Asymmetry**. By utilizing a bento-style grid with varying column spans (e.g., 7-span vs 5-span pairings) and mixing serif italics within headlines, the interface avoids the rigid "template" look. It creates a sense of human curation, where every element is placed with the precision of a gallery installation.
 
### 2. Colors
Our palette is rooted in the natural world—deep forest greens, burnt terracottas, and stone-washed neutrals.
 
*   **Primary (#384B3B):** A deep, authoritative "Evergreen" used for stability and key CTAs.
*   **Secondary (#8C4E32):** A warm "Terracotta" used to highlight creative accents and secondary calls to action.
*   **Neutral Roles:** The system relies on a warm-toned grey scale ranging from `Surface` (#fcf9f5) to `Surface Container Highest` (#e5e2de).
 
**The "No-Line" Rule**
Traditional 1px borders are strictly prohibited for sectioning. Boundaries must be established through shifts in background color. For example, moving from `Surface` to `Surface Container Low` (#f6f3ef) creates a structural break without visual clutter.
 
**Surface Hierarchy & Nesting**
Depth is created by "layering" surfaces. A `Surface Container Lowest` card should sit atop a `Surface Container Low` background. This "paper-on-stone" stacking logic provides natural hierarchy.
 
**Signature Textures**
Use a `hero-gradient` (Radial: #fcf9f5 to #f6f3ef) for large background areas to provide a subtle, vignette-like focus towards the center of the screen.
 
### 3. Typography
The system uses a high-contrast pairing of **Newsreader** (Headline) and **Manrope** (Body).
 
**Typography Scale (Extracted Ground Truth):**
*   **Display / Hero:** 4.5rem (72px) - Newsreader. Tight tracking, leading (1.05). Use italics for emphasis to break the rhythm.
*   **Headline Large:** 3.75rem (60px) or 3rem (48px).
*   **Title/Subhead:** 2.25rem (36px) or 1.875rem (30px).
*   **Body Large:** 1.25rem (20px) or 1.125rem (18px) - Manrope. Used for narrative text with relaxed leading.
*   **Label/Small:** 0.875rem (14px) or 0.75rem (12px). Often used in uppercase with 0.1em tracking for tags and descriptors.
 
The typographic rhythm is intentionally varied, using italicized serif weights to convey a sense of "premium storytelling."
 
### 4. Elevation & Depth
Elevation in Sage & Stone is achieved through **Ambient Shadows** and **Tonal Stacking** rather than high-contrast drop shadows.
 
*   **The Layering Principle:** Instead of shadows, use the progression of Surface colors (Low -> High) to indicate "lifting" from the background.
*   **Editorial Shadow:** For featured cards or images, use a dual-layer shadow: 
    *   *Primary:* 0 20px 40px rgba(28, 28, 26, 0.04)
    *   *Secondary:* 0 8px 16px rgba(28, 28, 26, 0.02)
    This creates an extremely soft, diffused lift that mimics natural ambient light.
*   **Glassmorphism:** Use `backdrop-blur-xl` with 80% opacity for floating navigation bars to maintain context while ensuring legibility.
 
### 5. Components
*   **Buttons:** Primary buttons are pill-shaped (`rounded-full`) or large blocks with `rounded-2xl`. No borders; use solid fills of `Primary` or `Secondary`.
*   **Bento Cards:** Use `rounded-2xl` corners. Cards should use the `Surface Container Lowest` (#ffffff) background against a `Surface Container Low` (#f6f3ef) section.
*   **Navigation:** A sticky top bar with a backdrop blur and no bottom border. Active states are indicated by a 2px bottom-border matching the primary color.
*   **Inputs:** Minimalist fields with subtle `Outline Variant` (#c3c8c0) borders or simple background shifts. Focus states should use `Primary`.
 
### 6. Do's and Don'ts
**Do:**
*   Use asymmetric grid layouts (e.g., 7/5 or 8/4 splits).
*   Use serif italics for exactly one word in a large headline to add "editorial" flair.
*   Utilize whitespace as a functional element to separate content groups.
 
**Don't:**
*   Use 1px solid borders for layout containers.
*   Use pure black (#000000) or pure white (#FFFFFF) for body text; use `On-Surface` (#1c1c1a) instead.
*   Overuse shadows; rely on tonal background shifts first.