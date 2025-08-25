'use client';

import React from 'react';
import { useSceneStore } from '../lib/store';

export function ScreenshotPreview() {
  const { screenshotPreviewUrl } = useSceneStore(state => state.ui);
  const setScreenshotPreviewUrl = useSceneStore(state => state.setScreenshotPreviewUrl);

  if (!screenshotPreviewUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = screenshotPreviewUrl;
    link.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setScreenshotPreviewUrl(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '24px' }}>
            Thumbnail Preview
          </h2>
        </div>

        {/* Captured Image */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <img
            src={screenshotPreviewUrl}
            alt="Captured Thumbnail"
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              borderRadius: '8px',
              border: '1px solid #444',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Download PNG
          </button>

          <button
            onClick={() => console.log('Send to Artist clicked')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Send to Artist
          </button>

          <button
            onClick={() => console.log('Generate with AI clicked')}
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Generate with AI
          </button>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #444',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
