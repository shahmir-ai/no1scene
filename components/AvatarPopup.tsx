'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AvatarPreview } from './AvatarPreview';
import { avatarLibrary, type LibraryAvatar } from '../lib/avatarLibrary';
import { useSceneStore } from '../lib/store';
import { loadAvatarFromUrl } from '../lib/avatarLoader';


interface AvatarPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarPopup({ isOpen, onClose }: AvatarPopupProps) {
  const [libraryAvatars, setLibraryAvatars] = useState<LibraryAvatar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const store = useSceneStore();
  const { addAvatar, setAvatarObject, setSelectedAvatar, setAvatarIK } = store;

  // Load avatar library when popup opens
  useEffect(() => {
    if (isOpen) {
      loadPresetAvatars();
    }
  }, [isOpen]);

  const loadPresetAvatars = async () => {
    // Load existing avatars from library
    const existingAvatars = avatarLibrary.getAvatars();
    
    // Add preset avatars if they don't exist
    const presetAvatars = [
      {
        name: 'MrBeast',
        file: '/mrbeast.glb',
        provider: 'Preset'
      },
      {
        name: 'Shahmir', 
        file: '/shahmir.glb',
        provider: 'Preset'
      }
    ];

    for (const preset of presetAvatars) {
      // Check if avatar already exists
      const exists = existingAvatars.some(avatar => avatar.name === preset.name);
      if (!exists) {
        try {
          // Add to library with current date
          const avatarData = {
            name: preset.name,
            src: preset.file,
            provider: 'manual' as const
          };
          
          avatarLibrary.addAvatar(avatarData);
        } catch (error) {
          console.warn(`Failed to add preset avatar ${preset.name}:`, error);
        }
      }
    }
    
    // Update state with all avatars
    setLibraryAvatars(avatarLibrary.getAvatars());
  };

  const handleSelectAvatar = async (avatar: LibraryAvatar) => {
    try {
      setIsLoading(true);
      
      // Generate unique avatar ID
      const avatarId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Load the avatar using our utility function
      const { scene, bones, morphTargets, skinnedMesh } = await loadAvatarFromUrl(avatar.src, avatar.name);
      
      // Add the scene to the global scene
      if ((window as any).__scene) {
        (window as any).__scene.add(scene);
      }
      
      // Create avatar data for the store
      const avatarData = {
        id: avatarId,
        src: avatar.src,
        position: [0, 0, 0] as [number, number, number],
        rotationEuler: [0, 0, 0] as [number, number, number],
        scale: 1,
        pose: {},
        morphs: {},
      } as any;
      
      // Store display name for UI purposes
      avatarData.displayName = avatar.name;

      // Add to store
      addAvatar(avatarData);
      
      // Set the Three.js object
      setAvatarObject(avatarId, scene, bones, morphTargets, skinnedMesh);

      // Skip IK setup - we're using direct bone rotation instead
      setAvatarIK(avatarId, null);

      // Auto-select the new avatar
      setSelectedAvatar(avatarId);

      console.log(`Avatar loaded successfully: ${avatar.name}`);
      onClose();
      
    } catch (error) {
      console.error('Failed to load avatar:', error);
      // Don't show alert since the model might actually load successfully
      // The error might be from a secondary operation
    } finally {
      setIsLoading(false);
    }
  };

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
      zIndex: 1000
    }}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid #333',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
            Select Avatar
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            zIndex: 10
          }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div>Loading Avatar...</div>
            </div>
          </div>
        )}

        {/* Avatar Library */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {libraryAvatars.map(avatar => (
            <div
              key={avatar.id}
              onClick={() => !isLoading && handleSelectAvatar(avatar)}
              style={{
                background: '#2a2a2a',
                borderRadius: '8px',
                padding: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: '2px solid transparent',
                transition: 'border-color 0.2s ease',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = '#0070f3')}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{
                width: '100%',
                height: '100px',
                borderRadius: '4px',
                marginBottom: '8px',
                overflow: 'hidden'
              }}>
                                      {avatar.src ? (
                        <AvatarPreview 
                          modelUrl={avatar.src} 
                          width={150} 
                          height={100}
                          variant="popup"
                        />
                      ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    🎭
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px', color: 'white' }}>
                {avatar.name}
              </div>
              <div style={{ fontSize: '9px', color: '#888' }}>
                {avatar.provider} • {avatar.createdAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Create New Avatar Button */}
        <div style={{
          borderTop: '1px solid #333',
          paddingTop: '16px',
          textAlign: 'center'
        }}>
          <Link 
            href="/avatar-creator"
            style={{
              display: 'inline-block',
              background: '#0070f3',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500
            }}
            onClick={onClose}
          >
            Create New Avatar
          </Link>
        </div>
      </div>
    </div>
  );
}
