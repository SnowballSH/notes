import { isName } from "../notes/names.ts";

/** A widget's name also names its component, so it must start with a letter. */
export const isWidgetName = (text: string): boolean => isName(text) && /^[a-z]/.test(text);

const capitalise = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

/** `hadamard-tiling` is implemented by the component `HadamardTiling`. */
export const componentName = (widget: string): string => widget.split("-").map(capitalise).join("");
