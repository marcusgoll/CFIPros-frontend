/**
 * API Versioning Compatibility Checks
 * Validates API version compatibility and handles version transitions
 */

export interface ApiVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface VersionCompatibility {
  compatible: boolean;
  reason: string;
  impact: 'none' | 'low' | 'medium' | 'high' | 'breaking';
  recommendations: string[];
  migrationRequired: boolean;
  deprecationWarnings: string[];
}

export interface ApiEndpoint {
  path: string;
  method: string;
  version: ApiVersion;
  deprecated?: boolean;
  removedIn?: ApiVersion;
  replacedBy?: string;
  lastModified?: Date;
}

export interface VersionedApiSpec {
  version: ApiVersion;
  endpoints: ApiEndpoint[];
  schemas: Record<string, {
    version: ApiVersion;
    deprecated?: boolean;
    removedIn?: ApiVersion;
  }>;
  changelog: VersionChange[];
}

export interface VersionChange {
  version: ApiVersion;
  date: Date;
  type: 'major' | 'minor' | 'patch';
  changes: ChangeItem[];
}

export interface ChangeItem {
  type: 'added' | 'modified' | 'deprecated' | 'removed';
  category: 'endpoint' | 'schema' | 'field' | 'enum';
  path: string;
  description: string;
  impact: 'none' | 'low' | 'medium' | 'high' | 'breaking';
  migration?: string;
}

export class ApiVersionManager {
  private currentVersion: ApiVersion;
  private supportedVersions: ApiVersion[];
  private specs: Map<string, VersionedApiSpec> = new Map();

  constructor(currentVersion: string, supportedVersions: string[] = []) {
    this.currentVersion = this.parseVersion(currentVersion);
    this.supportedVersions = supportedVersions.map(v => this.parseVersion(v));
    
    // Ensure current version is in supported versions
    if (!this.supportedVersions.some(v => this.versionsEqual(v, this.currentVersion))) {
      this.supportedVersions.push(this.currentVersion);
    }
  }

  /**
   * Parse semantic version string
   */
  parseVersion(versionString: string): ApiVersion {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    const match = versionString.match(regex);
    
    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
    };
  }

  /**
   * Convert version to string
   */
  versionToString(version: ApiVersion): string {
    let versionString = `${version.major}.${version.minor}.${version.patch}`;
    if (version.prerelease) {
      versionString += `-${version.prerelease}`;
    }
    if (version.build) {
      versionString += `+${version.build}`;
    }
    return versionString;
  }

  /**
   * Check if two versions are equal
   */
  versionsEqual(v1: ApiVersion, v2: ApiVersion): boolean {
    return (
      v1.major === v2.major &&
      v1.minor === v2.minor &&
      v1.patch === v2.patch &&
      v1.prerelease === v2.prerelease
    );
  }

  /**
   * Compare two versions (-1: v1 < v2, 0: v1 == v2, 1: v1 > v2)
   */
  compareVersions(v1: ApiVersion, v2: ApiVersion): number {
    if (v1.major !== v2.major) { return v1.major - v2.major; }
    if (v1.minor !== v2.minor) { return v1.minor - v2.minor; }
    if (v1.patch !== v2.patch) { return v1.patch - v2.patch; }
    
    // Handle prerelease versions
    if (v1.prerelease && !v2.prerelease) { return -1; }
    if (!v1.prerelease && v2.prerelease) { return 1; }
    if (v1.prerelease && v2.prerelease) {
      return v1.prerelease.localeCompare(v2.prerelease);
    }
    
    return 0;
  }

  /**
   * Check version compatibility
   */
  checkCompatibility(clientVersion: string, serverVersion: string): VersionCompatibility {
    const client = this.parseVersion(clientVersion);
    const server = this.parseVersion(serverVersion);
    
    const comparison = this.compareVersions(client, server);
    
    // Major version mismatch
    if (client.major !== server.major) {
      return {
        compatible: false,
        reason: `Major version mismatch: client v${client.major}, server v${server.major}`,
        impact: 'breaking',
        recommendations: [
          'Update client to match server major version',
          'Review breaking changes documentation',
          'Plan migration strategy for major version upgrade',
        ],
        migrationRequired: true,
        deprecationWarnings: [],
      };
    }

    // Client ahead of server (minor/patch)
    if (comparison > 0) {
      const versionDiff = client.minor - server.minor;
      if (versionDiff > 2) {
        return {
          compatible: false,
          reason: `Client version significantly ahead: client v${this.versionToString(client)}, server v${this.versionToString(server)}`,
          impact: 'high',
          recommendations: [
            'Update server to support newer client features',
            'Use feature detection instead of version checking',
            'Consider backward compatibility mode',
          ],
          migrationRequired: false,
          deprecationWarnings: [
            'Some client features may not work with older server version',
          ],
        };
      }
      
      return {
        compatible: true,
        reason: `Client version ahead but compatible: client v${this.versionToString(client)}, server v${this.versionToString(server)}`,
        impact: 'low',
        recommendations: [
          'Update server when possible',
          'Use progressive enhancement for newer features',
        ],
        migrationRequired: false,
        deprecationWarnings: [],
      };
    }

    // Server ahead of client
    if (comparison < 0) {
      const versionDiff = server.minor - client.minor;
      if (versionDiff > 5) {
        return {
          compatible: true,
          reason: `Client version significantly behind: client v${this.versionToString(client)}, server v${this.versionToString(server)}`,
          impact: 'medium',
          recommendations: [
            'Update client to latest version',
            'Check for deprecated API usage',
            'Review migration guides for newer versions',
          ],
          migrationRequired: false,
          deprecationWarnings: [
            'Client is using older API version',
            'Consider updating to access newer features',
          ],
        };
      }
      
      return {
        compatible: true,
        reason: `Server version ahead: client v${this.versionToString(client)}, server v${this.versionToString(server)}`,
        impact: 'low',
        recommendations: [
          'Update client when convenient',
          'Review changelog for new features',
        ],
        migrationRequired: false,
        deprecationWarnings: [],
      };
    }

    // Versions match
    return {
      compatible: true,
      reason: `Versions match: v${this.versionToString(client)}`,
      impact: 'none',
      recommendations: [],
      migrationRequired: false,
      deprecationWarnings: [],
    };
  }

  /**
   * Register API specification for a version
   */
  registerSpec(spec: VersionedApiSpec): void {
    const versionKey = this.versionToString(spec.version);
    this.specs.set(versionKey, spec);
  }

  /**
   * Get supported endpoints for a version
   */
  getEndpoints(version: string): ApiEndpoint[] {
    const spec = this.specs.get(version);
    return spec ? spec.endpoints : [];
  }

  /**
   * Check if endpoint is deprecated
   */
  isEndpointDeprecated(path: string, method: string, version: string): {
    deprecated: boolean;
    removedIn?: string;
    replacedBy?: string;
    message?: string;
  } {
    const endpoints = this.getEndpoints(version);
    const endpoint = endpoints.find(e => e.path === path && e.method.toLowerCase() === method.toLowerCase());
    
    if (!endpoint) {
      return { deprecated: false };
    }
    
    if (endpoint.deprecated) {
      return {
        deprecated: true,
        removedIn: endpoint.removedIn ? this.versionToString(endpoint.removedIn) : undefined,
        replacedBy: endpoint.replacedBy,
        message: `Endpoint ${method.toUpperCase()} ${path} is deprecated`,
      };
    }
    
    return { deprecated: false };
  }

  /**
   * Get migration path between versions
   */
  getMigrationPath(fromVersion: string, toVersion: string): ChangeItem[] {
    const from = this.parseVersion(fromVersion);
    const to = this.parseVersion(toVersion);
    
    if (this.compareVersions(from, to) >= 0) {
      return []; // No migration needed for same/older version
    }
    
    const migrationChanges: ChangeItem[] = [];
    
    // Collect all changes between versions
    for (const [, spec] of this.specs) {
      if (this.compareVersions(spec.version, from) > 0 && this.compareVersions(spec.version, to) <= 0) {
        migrationChanges.push(...spec.changelog.flatMap(change => change.changes));
      }
    }
    
    // Sort by impact (breaking changes first)
    const impactOrder = { 'breaking': 0, 'high': 1, 'medium': 2, 'low': 3, 'none': 4 };
    migrationChanges.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
    
    return migrationChanges;
  }

  /**
   * Validate request against version-specific schema
   */
  validateVersionedRequest(
    path: string,
    method: string,
    data: unknown,
    version: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const endpoint = this.getEndpoints(version).find(
      e => e.path === path && e.method.toLowerCase() === method.toLowerCase()
    );
    
    if (!endpoint) {
      return {
        valid: false,
        errors: [`Endpoint ${method.toUpperCase()} ${path} not found in API version ${version}`],
        warnings: [],
      };
    }
    
    const warnings: string[] = [];
    
    // Check for deprecation
    const deprecation = this.isEndpointDeprecated(path, method, version);
    if (deprecation.deprecated) {
      warnings.push(deprecation.message || 'Endpoint is deprecated');
      if (deprecation.replacedBy) {
        warnings.push(`Use ${deprecation.replacedBy} instead`);
      }
      if (deprecation.removedIn) {
        warnings.push(`Will be removed in version ${deprecation.removedIn}`);
      }
    }
    
    // In a real implementation, this would validate against the schema
    // For now, just return successful validation with warnings
    return {
      valid: true,
      errors: [],
      warnings,
    };
  }

  /**
   * Generate compatibility report
   */
  generateCompatibilityReport(clientVersion: string): {
    version: string;
    compatibility: VersionCompatibility;
    deprecatedEndpoints: { path: string; method: string; removedIn?: string; replacedBy?: string }[];
    migrationRecommendations: ChangeItem[];
    supportStatus: 'supported' | 'deprecated' | 'unsupported';
  } {
    const client = this.parseVersion(clientVersion);
    const compatibility = this.checkCompatibility(clientVersion, this.versionToString(this.currentVersion));
    
    // Find deprecated endpoints
    const deprecatedEndpoints: { path: string; method: string; removedIn?: string; replacedBy?: string }[] = [];
    const endpoints = this.getEndpoints(clientVersion);
    
    for (const endpoint of endpoints) {
      if (endpoint.deprecated) {
        deprecatedEndpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          removedIn: endpoint.removedIn ? this.versionToString(endpoint.removedIn) : undefined,
          replacedBy: endpoint.replacedBy,
        });
      }
    }
    
    // Get migration recommendations
    const migrationRecommendations = this.getMigrationPath(clientVersion, this.versionToString(this.currentVersion));
    
    // Determine support status
    let supportStatus: 'supported' | 'deprecated' | 'unsupported' = 'unsupported';
    if (this.supportedVersions.some(v => this.versionsEqual(v, client))) {
      supportStatus = 'supported';
    } else if (client.major === this.currentVersion.major && client.minor >= this.currentVersion.minor - 2) {
      supportStatus = 'deprecated';
    }
    
    return {
      version: clientVersion,
      compatibility,
      deprecatedEndpoints,
      migrationRecommendations,
      supportStatus,
    };
  }
}

// Default API version configurations
export const API_VERSIONS = {
  CURRENT: '1.0.0',
  SUPPORTED: ['1.0.0', '0.9.0', '0.8.0'],
  DEPRECATED: ['0.7.0', '0.6.0'],
  UNSUPPORTED: ['0.5.0', '0.4.0', '0.3.0', '0.2.0', '0.1.0'],
};

// Global API version manager instance
export const apiVersionManager = new ApiVersionManager(
  API_VERSIONS.CURRENT,
  API_VERSIONS.SUPPORTED
);

// Example API specification registration
const v1Spec: VersionedApiSpec = {
  version: apiVersionManager.parseVersion('1.0.0'),
  endpoints: [
    {
      path: '/extractor/extract',
      method: 'POST',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    {
      path: '/extractor/results/{batchId}',
      method: 'GET',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    {
      path: '/auth/session',
      method: 'GET',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    {
      path: '/auth/status',
      method: 'GET',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    {
      path: '/auth/refresh',
      method: 'POST',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    {
      path: '/auth/clerk/webhook',
      method: 'POST',
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
  ],
  schemas: {
    ExtractResponse: {
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
    ErrorResponse: {
      version: apiVersionManager.parseVersion('1.0.0'),
      deprecated: false,
    },
  },
  changelog: [
    {
      version: apiVersionManager.parseVersion('1.0.0'),
      date: new Date('2025-09-08'),
      type: 'major',
      changes: [
        {
          type: 'added',
          category: 'endpoint',
          path: '/extractor/extract',
          description: 'Added file extraction endpoint',
          impact: 'none',
        },
        {
          type: 'added',
          category: 'endpoint',
          path: '/extractor/results/{batchId}',
          description: 'Added results retrieval endpoint',
          impact: 'none',
        },
        {
          type: 'added',
          category: 'endpoint',
          path: '/auth/session',
          description: 'Added session management endpoint',
          impact: 'none',
        },
      ],
    },
  ],
};

// Register default specification
apiVersionManager.registerSpec(v1Spec);

export default apiVersionManager;