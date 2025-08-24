/**
 * Avaturn API Integration
 * 
 * Avaturn provides REST API for creating 3D avatars from photos.
 * Requires API key for access.
 * 
 * API Documentation: https://docs.avaturn.me/
 */

export interface AvaturnConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AvaturnCreateRequest {
  photoData: string; // Base64 encoded image
  parameters?: {
    bodyType?: 'half' | 'full';
    style?: 'realistic' | 'cartoon';
    gender?: 'auto' | 'male' | 'female';
  };
}

export interface AvaturnJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  avatarUrl?: string;
  error?: string;
}

export class AvaturnProvider {
  private config: AvaturnConfig;

  constructor(config: AvaturnConfig) {
    this.config = {
      baseUrl: 'https://api.avaturn.me/v1',
      ...config
    };
  }

  /**
   * Create avatar from photo
   */
  async createAvatar(photo: File, parameters?: AvaturnCreateRequest['parameters']): Promise<string> {
    // Convert photo to base64
    const photoData = await this.fileToBase64(photo);

    const requestBody: AvaturnCreateRequest = {
      photoData,
      parameters: {
        bodyType: 'full',
        style: 'realistic',
        gender: 'auto',
        ...parameters
      }
    };

    const response = await fetch(`${this.config.baseUrl}/avatars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Avaturn API error: ${error.message}`);
    }

    const { jobId } = await response.json();
    return jobId;
  }

  /**
   * Check job status
   */
  async getJobStatus(jobId: string): Promise<AvaturnJobStatus> {
    const response = await fetch(`${this.config.baseUrl}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Poll for job completion
   */
  async waitForCompletion(jobId: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getJobStatus(jobId);
          
          if (onProgress && status.progress) {
            onProgress(status.progress);
          }

          switch (status.status) {
            case 'completed':
              clearInterval(pollInterval);
              if (status.avatarUrl) {
                resolve(status.avatarUrl);
              } else {
                reject(new Error('Avatar URL not provided'));
              }
              break;
              
            case 'failed':
              clearInterval(pollInterval);
              reject(new Error(status.error || 'Avatar creation failed'));
              break;
              
            case 'pending':
            case 'processing':
              // Continue polling
              break;
              
            default:
              clearInterval(pollInterval);
              reject(new Error(`Unknown status: ${status.status}`));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Avatar creation timeout'));
      }, 300000);
    });
  }

  /**
   * Download avatar GLB file
   */
  async downloadAvatar(avatarUrl: string): Promise<Blob> {
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error(`Failed to download avatar: ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Check if Avaturn is available (API key configured)
 */
export function isAvaturnAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_AVATURN_API_KEY || process.env.AVATURN_API_KEY);
}

/**
 * Factory function for creating Avaturn provider
 */
export function createAvaturnProvider(): AvaturnProvider | null {
  const apiKey = process.env.NEXT_PUBLIC_AVATURN_API_KEY || process.env.AVATURN_API_KEY;
  
  if (!apiKey) {
    console.warn('Avaturn API key not configured');
    return null;
  }

  return new AvaturnProvider({ apiKey });
}
