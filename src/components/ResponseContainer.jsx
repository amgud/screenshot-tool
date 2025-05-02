import React from 'react';

const ResponseContainer = ({ data, parseMarkdown }) => {
  if (!data) return null;

  return (
    <div className="response-container" style={{ display: 'block' }}>
      {data.type === 'error' && (
        <div className="error-message">{data.message}</div>
      )}

      {data.type === 'success' && (
        <>
          <div className="success-message">{data.message}</div>
          {data.content && (
            <div className="response-message">
              <h3>Gemini Response:</h3>
              <div
                className="response-text markdown-content"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(data.content),
                }}
              />
            </div>
          )}
        </>
      )}

      {data.type === 'history' && (
        <>
          <div className="success-message">{data.message}</div>
          {data.content && (
            <div className="response-message">
              <h3>Gemini Response:</h3>
              <div
                className="response-text markdown-content"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(data.content),
                }}
              />
            </div>
          )}
        </>
      )}

      {data.type === 'warning' && (
        <div className="warning-message">{data.message}</div>
      )}
    </div>
  );
};

export default ResponseContainer;
