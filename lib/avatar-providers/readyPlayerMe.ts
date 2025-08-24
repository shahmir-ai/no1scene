/**
 * Ready Player Me Integration
 * 
 * Ready Player Me offers two main integration methods:
 * 1. Avatar Creator (Iframe) - Free, no API key required
 * 2. REST API - Requires subscription for advanced features
 * 
 * For this implementation, we'll use the iframe method for simplicity.
 */

export interface ReadyPlayerMeConfig {
  subdomain?: string; // Your RPM subdomain (optional)
  bodyType?: 'halfbody' | 'fullbody';
  quickStart?: boolean;
  clearCache?: boolean;
}

export interface AvatarCreatedData {
  avatarUrl: string;
  avatarId: string;
}

export class ReadyPlayerMeProvider {
  private config: ReadyPlayerMeConfig;
  private iframe: HTMLIFrameElement | null = null;
  private onAvatarCreated?: (data: AvatarCreatedData) => void;

  constructor(config: ReadyPlayerMeConfig = {}) {
    this.config = {
      bodyType: 'fullbody',
      quickStart: false,
      clearCache: false,
      ...config
    };
  }

  /**
   * Create an iframe for avatar creation
   */
  createIframe(container: HTMLElement, onAvatarCreated: (data: AvatarCreatedData) => void): HTMLIFrameElement {
    this.onAvatarCreated = onAvatarCreated;

    // Clean up existing iframe
    if (this.iframe) {
      this.iframe.remove();
    }

    // Build URL with parameters - Updated for 2024 API
    // Ready Player Me now requires a proper subdomain or uses their public demo
    const baseUrl = this.config.subdomain 
      ? `https://${this.config.subdomain}.readyplayer.me/avatar`
      : 'https://readyplayer.me/avatar';

    const params = new URLSearchParams({
      frameApi: 'true',
      bodyType: this.config.bodyType || 'fullbody',
      quickStart: this.config.quickStart ? 'true' : 'false',
      clearCache: this.config.clearCache ? 'true' : 'false',
    });

    const iframeSrc = `${baseUrl}?${params.toString()}`;

    console.log('Creating Ready Player Me iframe with URL:', iframeSrc);

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = iframeSrc;
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.borderRadius = '8px';
    this.iframe.allow = 'camera *; microphone *; autoplay *';
    this.iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-downloads';

    // Set up message listener
    window.addEventListener('message', this.handleMessage);

    container.appendChild(this.iframe);
    return this.iframe;
  }

  /**
   * Handle messages from the iframe
   */
  private handleMessage = (event: MessageEvent) => {
    // Log all messages for debugging
    console.log('Received message from:', event.origin, 'Data:', event.data);

    // Verify origin for security
    if (!event.origin.includes('readyplayer.me')) {
      console.log('Message not from readyplayer.me, ignoring');
      return;
    }

    const { type, data } = event.data;

    console.log('Ready Player Me message type:', type, 'data:', data);

    switch (type) {
      case 'v1.avatar.exported':
        console.log('Avatar exported:', data);
        if (this.onAvatarCreated && data.url) {
          this.onAvatarCreated({
            avatarUrl: data.url,
            avatarId: this.extractAvatarId(data.url)
          });
        }
        break;
      
      case 'v1.user.authorized':
        console.log('User authorized:', data);
        break;
      
      case 'v1.frame.ready':
        console.log('Ready Player Me iframe is ready');
        break;

      case 'v1.user.set':
        console.log('User set:', data);
        break;

      case 'v1.avatar.exported':
        console.log('Avatar exported:', data);
        break;

      default:
        console.log('Unhandled RPM message type:', type, 'data:', data);
    }
  };

  /**
   * Extract avatar ID from URL
   */
  private extractAvatarId(url: string): string {
    const match = url.match(/\/([a-f0-9-]+)\.glb/);
    return match ? match[1] : '';
  }

  /**
   * Clean up the iframe and listeners
   */
  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    window.removeEventListener('message', this.handleMessage);
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
}

/**
 * Default Ready Player Me configuration
 */
export const defaultRPMConfig: ReadyPlayerMeConfig = {
  bodyType: 'fullbody',
  quickStart: false,
  clearCache: false,
};

/**
 * Helper function to check if Ready Player Me is available
 */
export function isReadyPlayerMeAvailable(): boolean {
  // RPM is always available as it's a web service
  return true;
}

/**
 * Factory function for creating RPM provider
 */
export function createReadyPlayerMeProvider(config?: ReadyPlayerMeConfig): ReadyPlayerMeProvider {
  return new ReadyPlayerMeProvider(config);
}
