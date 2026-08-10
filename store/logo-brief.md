# Logo brief — EzUnpack

Two parts: what to send the designer, and what to watch for when the files come
back. The second part is the one that saves money.

---

## Read this first: the package on offer is not an app package

The listing promises *2 logo concepts, high-resolution JPG and PNG, a 3D mockup,
and unlimited revisions*. That is a package built for a business card and a
website header. For a phone app, two of those four items are worth nothing and
the one thing that matters is not on the list.

**The 3D mockup is decoration.** A logo floating on a glossy card tells you
nothing about whether it survives at 48 pixels on a home screen.

**JPG is useless to you.** It cannot hold transparency, and the adaptive icon
foreground must be transparent.

**PNG alone traps you.** Every export we have discussed — five icon files at
different sizes, plus store artwork — comes from one drawing. Without the vector
source, every future change means going back to the designer and paying again.
When the first file arrived as a 336 × 445 PNG, the artwork had to be measured
pixel by pixel and rescaled before it could be used. That is the cost of no
vector.

**So: ask for the source files.** This is the single most important line in the
brief. Everything else can be fixed later if you have them, and almost nothing
can if you do not.

---

## What to send the designer

> ### EzUnpack — app icon and wordmark
>
> EzUnpack is an Android app that opens ZIP and RAR archives. It is built for
> people who find phones difficult — older users who receive a file on WhatsApp
> and do not know what to do with it. The design language is calm, plain and
> large: one green action button per screen, no jargon, generous type.
>
> **Existing direction.** We already have a concept we like: a capital **E** in
> front of a fan of offset sheets, suggesting layers being unpacked. Brand blue
> is **#386C96**. Please treat this as the starting point for one of the two
> concepts rather than starting from nothing — we would like it refined, not
> replaced. The second concept can be free.
>
> Known problems with the current drawing, which the refinement should solve:
>
> - It is **portrait** — noticeably taller than wide — so when centred inside a
>   launcher's circular mask it looks small and leaves the sides empty. It should
>   sit comfortably in a square.
> - The fan uses several thin dark sheets. At **48 pixels**, which is the real
>   size on a phone home screen, they merge into a shadow and stop reading as
>   layers. Fewer, thicker, more separated sheets would survive.
> - The layers sit directly behind the E and fill in the notches that make it an
>   E. This matters for the monochrome version below.
>
> ### Deliverables
>
> **Source files — required.**
> Layered vector source: `.ai` or `.svg`, plus `.eps` or `.pdf`. Text converted
> to outlines. Layers named and separable. Without these we cannot produce new
> sizes ourselves, and every later change becomes a new job.
>
> **Icon artwork, on a 1024 × 1024 px canvas, RGB:**
>
> 1. **Foreground** — the symbol only, transparent background.
> 2. **Background** — a flat colour, or a very simple shape. Named hex value.
> 3. **Monochrome** — see the note below. This is a separate drawing, not a
>    greyscale copy.
> 4. **Full icon** — the symbol on its background, opaque, square corners left
>    square. Android rounds them itself.
>
> **Wordmark** — "EzUnpack" as a horizontal lockup, transparent PNG at 2048 px
> wide plus vector. Used on the loading screen and in the store listing.
>
> **Feature graphic** — 1024 × 500 px, no transparency, no rounded corners. This
> is the banner Google Play shows above the description. If your package includes
> a 3D mockup we do not need, we would rather have this instead.
>
> ### The safe zone — please read, this is the usual mistake
>
> Android never shows an icon whole. It crops the outer sixth of every edge, then
> masks what is left to a shape the phone manufacturer chooses — a circle, a
> squircle, or a rounded square.
>
> On a 1024 × 1024 canvas:
>
> - Only the centred **683 × 683 px** square can ever be visible.
> - Only a centred **circle 626 px across** is visible on *every* phone.
>
> So: the drawing's bounding box must fit inside that 626 px circle, centred both
> ways. In practice its diagonal should be 626 px or less. Anything crossing the
> circle survives on some phones and is clipped on others, which is the worst of
> the three outcomes.
>
> ### The monochrome version — please read this too
>
> Android 13 and later can tint app icons to match the system theme. To do it, it
> **discards every colour in the monochrome file and keeps only the silhouette.**
>
> A flattened version of the layered logo does not work: the sheets behind the E
> fill in the gaps between its arms, and the result is an unreadable blob. The
> monochrome file must be drawn deliberately — the E alone, solid, no fan —
> filled black on transparent, sized to the same safe zone. Think of it as the
> logo's shadow, not its black-and-white photograph.
>
> ### Two checks before you send the final files
>
> 1. **View the icon at 48 × 48 pixels.** If it is not instantly recognisable at
>    that size, it is not finished. This is the size that matters.
> 2. **Mask it three ways** — circle, squircle, rounded square — and confirm
>    nothing important is clipped in any of them.
>
> ### Colour
>
> Brand blue is `#386C96`. Please supply hex values for every colour used, and
> confirm the icon works on both a white and a dark background.

---

## What to check when the files come back

Go through this before you approve anything and spend the revisions well.

- [ ] **Vector source is present and opens.** If you only got JPG and PNG, stop
      here and ask again. This is the one thing worth pushing on.
- [ ] **All four icon files are 1024 × 1024**, not the canvas of the drawing.
      The first version we received had the artboard at the drawing's size, which
      is not the same thing.
- [ ] **The foreground has real transparency** — check the corners, not the
      preview thumbnail.
- [ ] **The full icon has none.** Play rejects an alpha channel outright.
- [ ] **The monochrome file is the E alone**, not the whole stack flattened. Open
      it and look. This is the most likely thing to come back wrong, because it
      is the least familiar requirement.
- [ ] **Look at the icon at 48 px yourself.** Not at 100%. Shrink it.
- [ ] **The drawing sits inside the safe circle.** If you are unsure, send it to
      me and I will measure it — that is what the fit-check page did last time.

Spend the unlimited revisions on the 48-pixel test and the mask tests. Those are
the ones that decide whether the icon works on a phone. Colour and proportion
arguments are cheap to have later; a logo that dissolves at launcher size is not.
