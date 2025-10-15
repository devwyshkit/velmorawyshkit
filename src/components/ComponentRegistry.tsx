/**
 * Component Registry - Centralized component governance and documentation
 * Enforces naming conventions, prop standards, and accessibility compliance
 * Prevents duplicate component creation and ensures DLS compliance
 */

import { ReactNode, ComponentType } from 'react';

export interface ComponentMetadata {
  name: string;
  description: string;
  category: 'layout' | 'input' | 'display' | 'navigation' | 'feedback' | 'business';
  props: Record<string, {
    type: string;
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
  variants?: string[];
  accessibility: {
    ariaLabel?: boolean;
    keyboardNavigation?: boolean;
    screenReader?: boolean;
    colorContrast?: 'AA' | 'AAA';
  };
  mobileOptimized: boolean;
  dlsCompliant: boolean;
  version: string;
  owner: string;
  status: 'stable' | 'beta' | 'deprecated';
  examples?: string[];
  dependencies?: string[];
}

/**
 * Registry of DLS components only - Customer components removed
 * Components ready for customer UI rebuild
 */
export const COMPONENT_REGISTRY: Record<string, ComponentMetadata> = {
  // Layout Components - Core DLS
  'Card': {
    name: 'Card',
    description: 'Primary container component for content grouping',
    category: 'layout',
    props: {
      children: { type: 'ReactNode', required: true, description: 'Card content' },
      variant: { type: 'default | outline | ghost', required: false, description: 'Visual style variant', defaultValue: 'default' },
      className: { type: 'string', required: false, description: 'Additional CSS classes' }
    },
    variants: ['default', 'outline', 'ghost', 'elevated'],
    accessibility: {
      ariaLabel: true,
      keyboardNavigation: false,
      screenReader: true,
      colorContrast: 'AA'
    },
    mobileOptimized: true,
    dlsCompliant: true,
    version: '1.0.0',
    owner: 'design-system',
    status: 'stable',
    examples: ['<Card>Content here</Card>', '<Card variant="outline">Outlined card</Card>']
  },

  'Button': {
    name: 'Button',
    description: 'Primary action component with consistent styling and behavior',
    category: 'input',
    props: {
      children: { type: 'ReactNode', required: true, description: 'Button content' },
      variant: { type: 'default | destructive | outline | secondary | ghost | link', required: false, description: 'Visual style', defaultValue: 'default' },
      size: { type: 'default | sm | lg | icon', required: false, description: 'Button size', defaultValue: 'default' },
      disabled: { type: 'boolean', required: false, description: 'Disabled state', defaultValue: false },
      onClick: { type: 'function', required: false, description: 'Click handler' }
    },
    variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    accessibility: {
      ariaLabel: true,
      keyboardNavigation: true,
      screenReader: true,
      colorContrast: 'AA'
    },
    mobileOptimized: true,
    dlsCompliant: true,
    version: '1.0.0',
    owner: 'design-system',
    status: 'stable',
    examples: ['<Button>Click me</Button>', '<Button variant="outline" size="sm">Small outline</Button>']
  }
};

/**
 * Customer UI components removed during cleanup
 * Available for rebuild using DLS architecture
 */
export const DEPRECATED_COMPONENTS = {
  // Customer components removed - ready for DLS rebuild
  'Header': 'Removed - will be rebuilt with customer UI',
  'MobileFirstHero': 'Removed - will be rebuilt with customer UI', 
  'ProductGrid': 'Removed - will be rebuilt with customer UI',
  'VendorCard': 'Removed - will be rebuilt with customer UI',
  'GlobalSearch': 'Removed - will be rebuilt with customer UI'
};

/**
 * Banned naming patterns
 */
export const BANNED_PATTERNS = [
  /smart/i,
  /enhanced/i,
  /advanced/i,
  /ai/i,
  /legacy/i,
  /v2$/i,
  /new$/i,
  /copy$/i
];

/**
 * Component validation utility
 */
export class ComponentValidator {
  static validateName(name: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check banned patterns
    BANNED_PATTERNS.forEach(pattern => {
      if (pattern.test(name)) {
        issues.push(`Name contains banned pattern: ${pattern.source}`);
      }
    });

    // Check if already deprecated
    if (name in DEPRECATED_COMPONENTS) {
      issues.push(`Component is deprecated: ${DEPRECATED_COMPONENTS[name as keyof typeof DEPRECATED_COMPONENTS]}`);
    }

    // Check naming convention (PascalCase)
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      issues.push('Name must be PascalCase with no special characters');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  static validateRegistration(metadata: ComponentMetadata): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Required fields
    if (!metadata.name) issues.push('Name is required');
    if (!metadata.description) issues.push('Description is required');
    if (!metadata.category) issues.push('Category is required');
    if (!metadata.owner) issues.push('Owner is required');

    // Mobile optimization required
    if (!metadata.mobileOptimized) {
      issues.push('Component must be mobile-optimized for PWA compliance');
    }

    // DLS compliance required
    if (!metadata.dlsCompliant) {
      issues.push('Component must comply with Design Language System');
    }

    // Accessibility requirements
    if (!metadata.accessibility.colorContrast) {
      issues.push('Color contrast level (AA/AAA) must be specified');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  static suggestAlternative(name: string): string | null {
    // Suggest registered alternatives for banned patterns
    if (/smart/i.test(name) && name.toLowerCase().includes('search')) {
      return 'GlobalSearch';
    }
    if (/enhanced|advanced/i.test(name) && name.toLowerCase().includes('product')) {
      return 'ProductGrid';
    }
    if (/hero|carousel/i.test(name)) {
      return 'MobileFirstHero';
    }
    return null;
  }
}

/**
 * Hook for enforcing component registry usage
 */
export function useComponentRegistry(componentName: string) {
  const validation = ComponentValidator.validateName(componentName);
  const metadata = COMPONENT_REGISTRY[componentName];
  
  if (!validation.valid) {
    console.warn(`Component Registry Warning: ${componentName}`, validation.issues);
    
    const alternative = ComponentValidator.suggestAlternative(componentName);
    if (alternative) {
      console.warn(`Consider using: ${alternative}`);
    }
  }
  
  if (!metadata) {
    console.warn(`Component ${componentName} not found in registry. Register it first.`);
  }
  
  return {
    isRegistered: !!metadata,
    isValid: validation.valid,
    metadata,
    issues: validation.issues
  };
}

/**
 * Registry statistics for governance
 */
export function getRegistryStats() {
  const components = Object.values(COMPONENT_REGISTRY);
  
  return {
    totalComponents: components.length,
    byCategory: components.reduce((acc, comp) => {
      acc[comp.category] = (acc[comp.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: components.reduce((acc, comp) => {
      acc[comp.status] = (acc[comp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    mobileOptimized: components.filter(c => c.mobileOptimized).length,
    dlsCompliant: components.filter(c => c.dlsCompliant).length,
    deprecated: Object.keys(DEPRECATED_COMPONENTS).length
  };
}