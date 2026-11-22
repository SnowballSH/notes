# Widgets

A widget is an interactive Svelte component that a note places with
`#widget("name", prop: value)[fallback]`. This guide covers making one. How
widgets fit into the rest of the pipeline is in
[`notes-system.md`](notes-system.md#widgets).

## Create a widget

1. Scaffold it. The name is lowercase words joined by hyphens, starting with a
   letter, and is the name a note uses.

   ```sh
   pnpm run new:widget demo-counter
   ```

   This creates a directory with a working example and prints the Typst line
   and the playground address:

   ```
   src/lib/widgets/demo-counter/
     definition.ts        its props and its height
     DemoCounter.svelte   the component: the name in PascalCase
   ```

   Nothing else needs editing: a directory under `src/lib/widgets` that holds
   a `definition.ts` is a widget.

2. Run `pnpm run dev` and open
   [`/dev/widgets#demo-counter`](http://localhost:5173/dev/widgets#demo-counter).
   The widget is mounted there at the width of a note, and reloads as you edit.

3. Declare the props in `definition.ts` (see [The contract](#the-contract)).
   The playground grows a control for each.

4. Write the component in `DemoCounter.svelte`. Its props are typed from the
   definition, so a prop that is renamed or removed there is a type error here.
   Put helpers beside it (`hadamard-tiling/matrix.ts` is an example).

5. Go through the [checklist](#checklist) in the playground: both themes, a
   narrow window, the keyboard alone.

6. Set `height` once the layout is settled (see
   [Reserving height](#reserving-height)). The playground reports whether it
   matches.

7. Copy the Typst line from the playground into a note, and write the
   [fallback](#fallback-content) in its brackets.

   ```typst
   #widget("demo-counter", start: 5)[The counter needs JavaScript.]
   ```

8. Run `pnpm run check && pnpm run lint && pnpm run test && pnpm run build`.

To rename a widget, rename its directory and its component together. To delete
one, delete its directory.

## The contract

`definition.ts` is the one place that says what a widget accepts:

```ts
import { defineWidget } from "../contract.ts";

export default defineWidget({
	props: {
		start: { type: "integer", default: 1, min: 0, max: 6 },
		speed: { type: "number", default: 1, min: 0.25 },
		looping: { type: "boolean", default: false },
		label: { type: "text", default: "" },
		shape: { type: "choice", options: ["square", "circle"], default: "square" },
	},
	height: "12rem",
});
```

| Type | In Typst | In the component | Options |
|---|---|---|---|
| `integer` | `start: 2` | `number` | `min`, `max` (both optional, inclusive) |
| `number` | `speed: 0.5` | `number` | `min`, `max` |
| `boolean` | `looping: true` | `boolean` | |
| `text` | `label: "Parity"` | `string` | |
| `choice` | `shape: "circle"` | a union of the options | `options`, at least one |

Every prop has a `default`, so every prop is optional in a note. Three things
follow from the definition:

- The component's props type. Every prop is present, because the defaults are
  filled in before the component is mounted:

  ```svelte
  <script lang="ts">
  import type { WidgetProps } from "../contract.ts";
  import type definition from "./definition.ts";

  const { start, shape }: WidgetProps<typeof definition> = $props();
  </script>
  ```

- The check of every `#widget` call when a note is compiled (see
  [Validation errors](#validation-errors)). The component can rely on it: an
  `integer` with `min: 0, max: 6` is an integer from 0 to 6.
- The controls of the playground.

A rule that spans two props, such as "start is at most max", cannot be
declared; handle it in the component. A default that its own prop does not
allow fails the build and the tests.

`src/lib/widgets/contract.ts` holds these types, and `props.ts` the checks.

## Reserving height

While a widget's code loads, its placeholder shows the fallback. If the
mounted widget is taller, the text below it jumps. `height` in the definition
is the height of the mounted widget as a CSS length; the note compiler writes
it on the placeholder as `--widget-height`, and the placeholder takes that
height until the widget is mounted.

Give it only when the height does not depend on what the reader does or on
how text wraps. Add up the fixed parts in `rem`. Where a part depends on the
width, use `100vw - 2rem`, which is the width of a note in a narrow window
(the page has a 1rem gutter on each side). For example, `hadamard-tiling` is

```
  2.75rem                               the buttons
+ 0.75rem                               gap
+ min(100vw - 2rem, 20rem + 2px)        the square board with its border
+ 0.75rem                               gap
+ 1.3125rem + 0.25rem + 1.3125rem       two caption lines of 0.875rem × 1.5
= calc(7.125rem + min(100vw - 2rem, 20rem + 2px))
```

The playground prints the height the widget takes beside the height it
reserves, and warns when they differ. Check it in a narrow window and a wide
one. A widget whose height varies should leave `height` out.

## Fallback content

The content in the brackets of `#widget(...)[...]` is what the page shows
before the widget loads, without JavaScript, in the editor preview, and if the
widget fails to load. Say what the reader is missing, or give the same
information as static text or a figure. It is optional but worth a sentence.

The PDF edition of a note shows neither the widget nor this content, only a
line that points to the online page, so the text around a widget should read
sensibly without it. See [`notes-system.md`](notes-system.md#pdf-edition).

## The shared frame

Wrap the widget in `WidgetFrame` (`src/lib/widgets/WidgetFrame.svelte`). It
is a `<figure>` with the spacing and fonts every widget shares, and an
optional `caption` snippet rendered as a `<figcaption aria-live="polite">`:

```svelte
<WidgetFrame>
	<button type="button" onclick={() => count++}>Add one</button>
	{#snippet caption()}
		<p>The count is {count}.</p>
	{/snippet}
</WidgetFrame>
```

Use the caption for the sentence that says what the widget shows right now.

## Checklist

- **Keyboard.** Every control is a `<button>` or a form element, reachable
  with Tab and operable with Enter or Space. Controls are at least 2.75rem
  (44px) in the direction a finger has to hit. A control that is unavailable
  keeps its place in the tab order with `aria-disabled="true"`, looks
  disabled, and has no hover state.
- **Focus ring.** `outline: 2px solid var(--fui-accent); outline-offset: 2px`
  on `:focus-visible`.
- **Announcements.** State that changes is in the frame's caption, or in
  another `aria-live="polite"` element. A picture has `role="img"` and an
  `aria-label` that says what it shows.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, go straight to
  the end state. Check in script before starting a timed animation, and
  switch transitions off in CSS.
- **Theme.** Colours, radii and fonts come from the `--fui-*` tokens
  (`node_modules/foundationui/tokens.css`), which change with the theme.
  Something drawn on white, such as a canvas, takes
  `filter: var(--note-figure-filter, none)` so that it does not glare on the
  dark page.
- **Print.** Hide controls with `@media print`; what remains should make
  sense on paper.
- **Narrow windows.** Nothing is wider than `100%` at a window width of 320px.

## The playground

`/dev/widgets` lists every widget, mounted with its default props through the
same code that mounts it in a note. For each one it shows:

- a control per declared prop: a slider for a number with both bounds, a
  number field otherwise, a checkbox, a menu of the choices, or a text field.
  Changing one mounts the widget again with the new props; a value the
  definition does not allow is reported in the words of the build and the
  widget keeps its last valid props;
- the Typst line for the current props, with a button that copies it. Props
  left at their defaults are omitted;
- the height the widget takes and the height it reserves.

"Reset" returns to the defaults and mounts the widget afresh, which also
restarts any animation.

The page exists only while developing. Its `load` function answers 404 unless
`dev` from `$app/env` is true, the route is not prerendered, and nothing links
to it, so the built site has no such page.

## Validation errors

Every `#widget` call is checked when its note is compiled. `pnpm run build`
fails on a problem, and `pnpm run dev` shows it on the page in place of the
note. Each line names the file (by its full path, shortened here), the widget
and the prop:

```
notes/walsh-hadamard/walsh-hadamard.typ: unknown widget "hadamard-tilin"; the widgets are hadamard-tiling, parity-explorer
notes/walsh-hadamard/walsh-hadamard.typ: widget "hadamard-tiling": unknown prop "colour"; it takes start, max
notes/walsh-hadamard/walsh-hadamard.typ: widget "hadamard-tiling": prop "start" must be an integer from 0 to 6, not 9
```

Props must be named arguments; Typst itself rejects a positional one.
