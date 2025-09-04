/**
 * Authentication Background Refresh Service
 * 
 * Manages background refreshing of authentication data based on user activity
 * and cache expiration to maintain fresh data without impacting user experience
 */

import { QueryClient } from '@tanstack/react-query';
import { authKeys } from '@/lib/utils/query-keys';

export interface BackgroundRefreshConfig {
  userDataInterval: number; // milliseconds
  permissionsInterval: number; // milliseconds
  sessionCheckInterval: number; // milliseconds
  enableActivityBasedRefresh: boolean;
  enableStaleDataRefresh: boolean;
}

export class AuthBackgroundRefreshService {
  private queryClient: QueryClient;
  private config: BackgroundRefreshConfig;
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();
  private lastActivityTime: number = Date.now();
  private isActive: boolean = false;

  constructor(queryClient: QueryClient, config: Partial<BackgroundRefreshConfig> = {}) {
    this.queryClient = queryClient;
    this.config = {
      userDataInterval: 5 * 60 * 1000, // 5 minutes
      permissionsInterval: 2 * 60 * 1000, // 2 minutes
      sessionCheckInterval: 30 * 1000, // 30 seconds
      enableActivityBasedRefresh: true,
      enableStaleDataRefresh: true,
      ...config,
    };

    // Set up activity tracking if enabled
    if (this.config.enableActivityBasedRefresh) {
      this.setupActivityTracking();
    }
  }

  /**
   * Start background refresh for a specific user
   */
  start(userId: string, orgId?: string): void {
    if (this.isActive) {
      this.stop(); // Stop previous session
    }

    this.isActive = true;
    this.lastActivityTime = Date.now();

    // Start user data refresh interval
    const userRefreshId = setInterval(() => {
      this.refreshUserData(userId);
    }, this.config.userDataInterval);
    this.intervalIds.set('user-refresh', userRefreshId);

    // Start permissions refresh interval
    const permissionsRefreshId = setInterval(() => {
      this.refreshPermissions(userId);
    }, this.config.permissionsInterval);
    this.intervalIds.set('permissions-refresh', permissionsRefreshId);

    // Start session check interval
    const sessionCheckId = setInterval(() => {
      this.checkSession(userId);
    }, this.config.sessionCheckInterval);
    this.intervalIds.set('session-check', sessionCheckId);

    // Start organization refresh if org exists
    if (orgId) {
      const orgRefreshId = setInterval(() => {
        this.refreshOrganization(orgId);
      }, this.config.userDataInterval); // Same interval as user data
      this.intervalIds.set('org-refresh', orgRefreshId);
    }

    // Start stale data refresh if enabled
    if (this.config.enableStaleDataRefresh) {
      const staleRefreshId = setInterval(() => {
        this.refreshStaleData();
      }, 60 * 1000); // Check every minute
      this.intervalIds.set('stale-refresh', staleRefreshId);
    }
  }

  /**
   * Stop background refresh
   */
  stop(): void {
    this.isActive = false;
    
    // Clear all intervals
    this.intervalIds.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervalIds.clear();
  }

  /**
   * Refresh user data in background
   */
  private async refreshUserData(userId: string): Promise<void> {
    try {
      // Only refresh if user has been active recently (within 10 minutes)
      const inactiveTime = Date.now() - this.lastActivityTime;
      const maxInactiveTime = 10 * 60 * 1000; // 10 minutes

      if (this.config.enableActivityBasedRefresh && inactiveTime > maxInactiveTime) {
        return; // Skip refresh if user is inactive
      }

      // Perform background refresh
      await this.queryClient.refetchQueries({
        queryKey: authKeys.user(userId),
        type: 'active',
      });
    } catch (error) {
      // Silent failure for background refresh
      // eslint-disable-next-line no-console
      console.debug('Background user data refresh failed:', error);
    }
  }

  /**
   * Refresh permissions in background
   */
  private async refreshPermissions(userId: string): Promise<void> {
    try {
      // Permissions change more frequently, always refresh if active
      await this.queryClient.refetchQueries({
        queryKey: authKeys.status(userId),
        type: 'active',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Background permissions refresh failed:', error);
    }
  }

  /**
   * Check session validity
   */
  private async checkSession(userId: string): Promise<void> {
    try {
      // Quick session validity check
      const sessionData = this.queryClient.getQueryData(authKeys.status(userId)) as { session?: { hasActiveSession?: boolean } } | undefined;
      
      if (!sessionData?.session?.hasActiveSession) {
        // Session appears invalid, trigger refresh
        await this.queryClient.refetchQueries({
          queryKey: authKeys.status(userId),
          type: 'active',
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Background session check failed:', error);
    }
  }

  /**
   * Refresh organization data
   */
  private async refreshOrganization(orgId: string): Promise<void> {
    try {
      await this.queryClient.refetchQueries({
        queryKey: authKeys.org(orgId),
        type: 'active',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Background organization refresh failed:', error);
    }
  }

  /**
   * Refresh stale data across all auth queries
   */
  private async refreshStaleData(): Promise<void> {
    try {
      // Get all auth queries and check if they're stale
      const queryCache = this.queryClient.getQueryCache();
      const authQueries = queryCache.getAll().filter(query => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey[0] === 'auth';
      });

      for (const query of authQueries) {
        // Check if query is stale
        const queryOptions = query.options as { staleTime?: number };
        const staleTime = queryOptions.staleTime ?? 0;
        const dataUpdatedAt = query.state.dataUpdatedAt;
        const isStale = Date.now() - dataUpdatedAt > staleTime;

        if (isStale && query.state.data) {
          // Refresh stale query in background
          this.queryClient.refetchQueries({
            queryKey: query.queryKey,
            type: 'active',
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Stale data refresh failed:', error);
    }
  }

  /**
   * Set up activity tracking to optimize refresh frequency
   */
  private setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
    };

    // Throttle activity updates to avoid excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (throttleTimeout) {
        return;
      }
      
      throttleTimeout = setTimeout(() => {
        updateActivity();
        throttleTimeout = null;
      }, 5000); // Update at most every 5 seconds
    };

    // Add activity listeners
    if (typeof window !== 'undefined') {
      activityEvents.forEach(event => {
        window.addEventListener(event, throttledUpdateActivity, { passive: true });
      });

      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        this.stop();
      });

      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.lastActivityTime = Date.now();
        }
      });
    }
  }

  /**
   * Trigger immediate refresh of specific data
   */
  refreshNow = {
    user: async (userId: string) => {
      await this.queryClient.refetchQueries({
        queryKey: authKeys.user(userId),
        type: 'active',
      });
    },

    permissions: async (userId: string) => {
      await this.queryClient.refetchQueries({
        queryKey: authKeys.status(userId),
        type: 'active',
      });
    },

    organization: async (orgId: string) => {
      await this.queryClient.refetchQueries({
        queryKey: authKeys.org(orgId),
        type: 'active',
      });
    },

    all: async (userId: string, orgId?: string) => {
      const promises = [
        this.refreshNow.user(userId),
        this.refreshNow.permissions(userId),
      ];

      if (orgId) {
        promises.push(this.refreshNow.organization(orgId));
      }

      await Promise.all(promises);
    },
  };

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      activeIntervals: this.intervalIds.size,
      lastActivityTime: this.lastActivityTime,
      config: this.config,
    };
  }
}

/**
 * Create and configure background refresh service
 */
export function createAuthBackgroundRefresh(
  queryClient: QueryClient,
  config?: Partial<BackgroundRefreshConfig>
): AuthBackgroundRefreshService {
  return new AuthBackgroundRefreshService(queryClient, config);
}