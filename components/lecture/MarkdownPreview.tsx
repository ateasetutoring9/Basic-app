"use client";

// Client-boundary re-export of MarkdownContent so it can be used inside client
// component trees. MarkdownContent has no server-only imports, so this is safe;
// the only effect is including react-markdown in the client bundle for /edit.
export { default } from "./MarkdownContent";
