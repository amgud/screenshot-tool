/**
 * Markdown parser using marked library
 * @param {string} markdown - The markdown text to parse
 * @return {string} HTML output
 */
import { marked } from 'marked';

export function parseMarkdown(markdown) {
  if (!markdown) return '';

  // Configure marked options if needed
  marked.setOptions({
    breaks: true, // Add <br> on single line breaks
    gfm: true, // GitHub Flavored Markdown
  });

  // Parse markdown to HTML
  return marked.parse(markdown);
}
