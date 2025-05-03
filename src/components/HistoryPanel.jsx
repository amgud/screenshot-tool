import React from 'react';

export default function HistoryPanel({ history, onSelectItem }) {
  // Sort history items by timestamp (newest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div id="historyPanel" className="history-panel open">
      <h2>Screenshot History</h2>
      <div className="history-list" id="historyList">
        {sortedHistory.length === 0 ? (
          <p className="empty-history-message">
            No history items yet. Take a screenshot to get started!
          </p>
        ) : (
          sortedHistory.map((item) => {
            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString();

            // Create response preview (truncate if too long)
            let responsePreview = item.response || 'No response available';
            if (responsePreview.length > 150) {
              responsePreview = responsePreview.substring(0, 150) + '...';
            }

            return (
              <div
                key={item.id}
                className="history-item"
                data-id={item.id}
                onClick={() => onSelectItem(item.id)}
              >
                <div className="history-item-date">{formattedDate}</div>
                <div className="history-item-content">
                  <img
                    src={item.thumbnailUrl}
                    className="history-thumbnail"
                    alt="Screenshot thumbnail"
                  />
                  <div className="history-response-preview">
                    {responsePreview}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
