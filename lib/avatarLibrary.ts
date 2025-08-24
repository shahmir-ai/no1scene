/**
 * Avatar Library System
 * 
 * Manages locally stored avatars and their metadata
 * Uses browser localStorage for persistence
 */

export interface LibraryAvatar {
  id: string;
  name: string;
  src: string; // URL or path to GLB file
  provider: 'ready-player-me' | 'avaturn' | 'manual' | 'unknown';
  createdAt: Date;
  thumbnail?: string; // Base64 encoded thumbnail
  metadata?: {
    originalPhoto?: string; // Base64 encoded original photo
    providerAvatarId?: string;
    fileSize?: number;
    hasRig?: boolean;
    morphTargets?: string[];
    bones?: string[];
  };
  tags?: string[];
}

export class AvatarLibrary {
  private storageKey = 'no1scene-avatar-library';

  /**
   * Get all avatars from library
   */
  getAvatars(): LibraryAvatar[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const avatars = JSON.parse(stored);
      // Convert date strings back to Date objects
      return avatars.map((avatar: any) => ({
        ...avatar,
        createdAt: new Date(avatar.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load avatar library:', error);
      return [];
    }
  }

  /**
   * Add avatar to library
   */
  addAvatar(avatar: Omit<LibraryAvatar, 'id' | 'createdAt'>): LibraryAvatar {
    const newAvatar: LibraryAvatar = {
      ...avatar,
      id: this.generateId(),
      createdAt: new Date(),
    };

    const avatars = this.getAvatars();
    avatars.unshift(newAvatar); // Add to beginning

    this.saveAvatars(avatars);
    return newAvatar;
  }

  /**
   * Update avatar in library
   */
  updateAvatar(id: string, updates: Partial<LibraryAvatar>): LibraryAvatar | null {
    const avatars = this.getAvatars();
    const index = avatars.findIndex(a => a.id === id);
    
    if (index === -1) return null;

    avatars[index] = { ...avatars[index], ...updates };
    this.saveAvatars(avatars);
    return avatars[index];
  }

  /**
   * Remove avatar from library
   */
  removeAvatar(id: string): boolean {
    const avatars = this.getAvatars();
    const filtered = avatars.filter(a => a.id !== id);
    
    if (filtered.length === avatars.length) return false;

    this.saveAvatars(filtered);
    return true;
  }

  /**
   * Get avatar by ID
   */
  getAvatar(id: string): LibraryAvatar | null {
    return this.getAvatars().find(a => a.id === id) || null;
  }

  /**
   * Search avatars by name or tags
   */
  searchAvatars(query: string): LibraryAvatar[] {
    const avatars = this.getAvatars();
    const lowercaseQuery = query.toLowerCase();

    return avatars.filter(avatar => 
      avatar.name.toLowerCase().includes(lowercaseQuery) ||
      avatar.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      avatar.provider.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get avatars by provider
   */
  getAvatarsByProvider(provider: LibraryAvatar['provider']): LibraryAvatar[] {
    return this.getAvatars().filter(a => a.provider === provider);
  }

  /**
   * Get library statistics
   */
  getStats() {
    const avatars = this.getAvatars();
    const providers = avatars.reduce((acc, avatar) => {
      acc[avatar.provider] = (acc[avatar.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalSize = avatars.reduce((acc, avatar) => 
      acc + (avatar.metadata?.fileSize || 0), 0
    );

    return {
      total: avatars.length,
      providers,
      totalSize,
      oldestDate: avatars.length > 0 ? 
        Math.min(...avatars.map(a => a.createdAt.getTime())) : null,
      newestDate: avatars.length > 0 ? 
        Math.max(...avatars.map(a => a.createdAt.getTime())) : null,
    };
  }

  /**
   * Export library as JSON
   */
  exportLibrary(): string {
    return JSON.stringify(this.getAvatars(), null, 2);
  }

  /**
   * Import library from JSON
   */
  importLibrary(jsonData: string, merge: boolean = false): { success: boolean; imported: number; errors: string[] } {
    try {
      const importedAvatars = JSON.parse(jsonData) as LibraryAvatar[];
      const errors: string[] = [];
      let imported = 0;

      // Validate imported data
      const validAvatars = importedAvatars.filter((avatar, index) => {
        if (!avatar.id || !avatar.name || !avatar.src) {
          errors.push(`Avatar at index ${index} is missing required fields`);
          return false;
        }
        return true;
      });

      if (merge) {
        // Merge with existing avatars (avoid duplicates by ID)
        const existing = this.getAvatars();
        const existingIds = new Set(existing.map(a => a.id));
        
        validAvatars.forEach(avatar => {
          if (!existingIds.has(avatar.id)) {
            existing.push({
              ...avatar,
              createdAt: new Date(avatar.createdAt)
            });
            imported++;
          }
        });
        
        this.saveAvatars(existing);
      } else {
        // Replace entire library
        const processedAvatars = validAvatars.map(avatar => ({
          ...avatar,
          createdAt: new Date(avatar.createdAt)
        }));
        
        this.saveAvatars(processedAvatars);
        imported = processedAvatars.length;
      }

      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  /**
   * Clear entire library
   */
  clearLibrary(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Save avatars to localStorage
   */
  private saveAvatars(avatars: LibraryAvatar[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(avatars));
    } catch (error) {
      console.error('Failed to save avatar library:', error);
      throw new Error('Failed to save avatar library. Storage might be full.');
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global instance
export const avatarLibrary = new AvatarLibrary();

/**
 * Helper function to create thumbnail from GLB file
 */
export async function createAvatarThumbnail(glbFile: File | Blob): Promise<string> {
  // This would require Three.js to load the GLB and render a thumbnail
  // For now, return a placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HTE0gPC90ZXh0Pjwvc3ZnPg==';
}

/**
 * Helper function to get avatar file size
 */
export function getFileSize(file: File | Blob): number {
  return file.size;
}
