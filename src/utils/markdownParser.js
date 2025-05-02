/**
 * Simple markdown parser function
 * @param {string} markdown - The markdown text to parse
 * @return {string} HTML output
 *
 * Handles:
 * - Headings (#, ##, ###)
 * - Bold text (**text**)
 * - Italic text (*text*)
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Lists (ordered: 1. item, unordered: * item or - item)
 * - Links ([text](url))
 * - Paragraphs (new lines)
 */
export function parseMarkdown(markdown) {
  if (!markdown) return '';

  // Helper function to escape HTML
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  let html = markdown;

  // Process code blocks (```)
  html = html.replace(/```([^`]*?)```/gs, function (match, code) {
    return `<pre><code>${escapeHTML(code.trim())}</code></pre>`;
  });

  // Process inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Process headings (### Heading)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Process lists
  // Unordered lists
  html = html.replace(/^\s*[\*\-]\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, function (match) {
    // Only convert to <ol> if not already inside a <ul>
    if (match.indexOf('<ul>') === -1) {
      return '<ol>' + match + '</ol>';
    }
    return match;
  });

  // Process bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Process italic (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Process links [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank">$1</a>'
  );

  // Process paragraphs (lines not part of other elements)
  html = html.replace(/^(?!<[a-z])(.*)\n/gm, '<p>$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  return html;
}
