import { isName } from "../notes/names.ts";

export const isWidgetName = (text: string): boolean => isName(text) && /^[a-z]/.test(text);

const capitalise = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

export const componentName = (widget: string): string => widget.split("-").map(capitalise).join("");
