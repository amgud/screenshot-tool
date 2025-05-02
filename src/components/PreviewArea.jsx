import React from 'react';

export default function PreviewArea({ screenshot }) {
  return (
    <div className="preview-area" id="previewArea">
      {screenshot ? (
        <img src={screenshot} alt="Screenshot preview" />
      ) : (
        <p className="preview-text">Screenshot preview will appear here</p>
      )}
    </div>
  );
}
