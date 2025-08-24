'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

import { avatarLibrary, type LibraryAvatar } from '../../lib/avatarLibrary';
import { AvatarPreview } from '../../components/AvatarPreview';

export default function AvatarCreatorPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [libraryAvatars, setLibraryAvatars] = useState<LibraryAvatar[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load avatar library on mount
  useEffect(() => {
    loadPresetAvatars();
  }, []);

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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a GLB/GLTF file (manual upload)
    if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
      handleManualGLBUpload(file);
      return;
    }

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file or GLB/GLTF file');
      return;
    }

    // No other providers available for photos currently
    alert('Photo-to-avatar creation is not yet implemented. Please upload a GLB/GLTF file instead.');
  };

  const handleManualGLBUpload = async (file: File) => {
    try {
      setIsCreating(true);
      
      // Create object URL for local use
      const localUrl = URL.createObjectURL(file);
      
      // Add to avatar library
      const avatarName = file.name.replace(/\.(glb|gltf)$/i, '');
      const libraryAvatar = avatarLibrary.addAvatar({
        name: avatarName,
        src: localUrl,
        provider: 'manual',
        metadata: {
          fileSize: file.size,
        }
      });

      // Update UI
      setLibraryAvatars(avatarLibrary.getAvatars());
      setIsCreating(false);
      
      alert(`Avatar "${avatarName}" uploaded and saved to library!`);
      
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setIsCreating(false);
      alert('Failed to upload avatar. Please try again.');
    }
  };





  const handleManualUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          Avatar Creator
        </h1>
        <Link 
          href="/"
          style={{
            background: '#0070f3',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          → Scene Editor
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        height: 'calc(100vh - 81px)'
      }}>
        {/* Left Panel - Create Avatar */}
        <div style={{
          background: '#1e1e1e',
          padding: '20px',
          borderRight: '1px solid #333'
        }}>

          
          {/* Photo to Avatar Provider */}
          <div style={{
            padding: '16px',
            background: '#2a2a2a',
            borderRadius: '8px',
            marginBottom: '12px',
            opacity: 0.5,
            cursor: 'not-allowed',
            border: '2px solid transparent'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                Create Avatar
              </h4>
              <span style={{ 
                fontSize: '10px', 
                background: '#666', 
                padding: '2px 6px', 
                borderRadius: '4px' 
              }}>
                Coming Soon
              </span>
            </div>
            
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '12px', 
              color: '#ccc',
              lineHeight: '1.4'
            }}>
              AI-powered realistic 3D avatars from selfies
            </p>
            
            <button
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#555',
                border: 'none',
                color: '#999',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'not-allowed'
              }}
            >
              📷 Select Images
            </button>
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#2a2a2a',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              Manual Upload
            </h4>
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '12px', 
              color: '#888',
              lineHeight: '1.4'
            }}>
              Already have a rigged GLB file? Upload it directly.
            </p>
            <button
              onClick={handleManualUpload}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#4a4a4a',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📁 Upload GLB File
            </button>
          </div>
        </div>

        {/* Right Panel - Creation Interface */}
        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>


          {/* Avatar Library */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>
              Your Avatar Library ({libraryAvatars.length})
            </h2>
            
            {libraryAvatars.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {libraryAvatars.map(avatar => (
                  <div
                    key={avatar.id}
                    style={{
                      background: '#2a2a2a',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '2px solid transparent',
                      transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0070f3'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      overflow: 'hidden'
                    }}>
                      {avatar.src ? (
                        <AvatarPreview 
                          modelUrl={avatar.src} 
                          width={180} 
                          height={120} 
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
                    <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}>
                      {avatar.name}
                    </div>
                    <div style={{ fontSize: '9px', color: '#888' }}>
                      {avatar.provider} • {avatar.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: '#2a2a2a',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                  📁
                </div>
                <p style={{ margin: 0, color: '#888' }}>
                  No avatars yet. Create your first avatar below!
                </p>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Hidden file input for manual uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />

      {/* CSS for spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
