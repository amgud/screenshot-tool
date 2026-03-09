import React from 'react';

export default function ResponseContainer({ data, parseMarkdown }) {
  if (!data || !data.content) return null;

  return (
    <div className="response-container">
      <div
        className="response-text markdown-content"
        dangerouslySetInnerHTML={{
          __html: parseMarkdown(data.content),
        }}
      />
    </div>
  );
}
