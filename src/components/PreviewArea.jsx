import React from 'react';

const PreviewArea = ({ screenshot }) => {
  return (
    <div className="preview-area" id="previewArea">
      {screenshot ? (
        <img src={screenshot} alt="Screenshot preview" />
      ) : (
        <p className="preview-text">Screenshot preview will appear here</p>
      )}
    </div>
  );
};

export default PreviewArea;
