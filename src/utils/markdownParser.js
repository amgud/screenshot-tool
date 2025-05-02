/**
 * Utility for parsing markdown to HTML
 */
import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // Enable GitHub Flavored Markdown
  headerIds: false, // Don't add IDs to headers
  mangle: false, // Don't mangle email addresses
  sanitize: false, // Don't sanitize HTML (relying on DOMPurify instead)
});

/**
 * Convert Markdown text to HTML
 * @param {string} markdown - The markdown text to parse
 * @returns {string} HTML representation of the markdown
 */
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';

  try {
    // Parse the markdown to HTML
    const html = marked.parse(markdown);

    // Note: In a production app, you should use DOMPurify.sanitize(html)
    // to sanitize the HTML and prevent XSS attacks

    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return '<p>Error parsing markdown content</p>';
  }
};
