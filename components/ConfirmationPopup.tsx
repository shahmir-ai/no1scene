'use client';

import React from 'react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPopup({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmationPopupProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
        border: '1px solid #333',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Title */}
        <h3 style={{
          margin: '0 0 16px 0',
          color: 'white',
          fontSize: '18px',
          fontWeight: 600
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          margin: '0 0 24px 0',
          color: '#ccc',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #555',
              borderRadius: '6px',
              color: '#ccc',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
