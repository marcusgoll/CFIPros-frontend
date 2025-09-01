/**
 * Navigation configuration for the application
 * Centralized location for all navigation items to maintain DRY principle
 */

export interface MenuItem {
  icon?: keyof typeof import("lucide-react");
  title: string;
  description?: string;
  href: string;
  onClick?: () => void;
}

export interface MenuColumn {
  items: MenuItem[];
}

export interface NavigationMenu {
  title: string;
  columns?: MenuColumn[];
  items?: MenuItem[];
}

// Features mega menu configuration
export const featuresMenu: NavigationMenu = {
  title: "Our Features",
  columns: [
    {
      items: [
        {
          icon: "Upload" as const,
          title: "Upload Reports",
          description:
            "Upload your FAA Knowledge Test results for instant ACS code extraction",
          href: "/upload",
        },
        {
          icon: "Search" as const,
          title: "ACS Search",
          description:
            "Search through 10,257+ ACS codes from official FAA publications",
          href: "/acs",
        },
        {
          icon: "FileText" as const,
          title: "Multiple Formats",
          description: "Support for PDF, JPG, and PNG file formats",
          href: "/upload",
        },
      ],
    },
    {
      items: [
        {
          icon: "BookOpen" as const,
          title: "Study Plans",
          description: "Personalized study guides based on your test results",
          href: "/study-plan",
        },
        {
          icon: "Trophy" as const,
          title: "Progress Tracking",
          description: "Track your learning progress and identify weak areas",
          href: "/dashboard",
        },
        {
          icon: "Users" as const,
          title: "Instructor Tools",
          description: "Advanced features for CFIs and flight schools",
          href: "/instructors",
        },
      ],
    },
  ],
};

// Instructors dropdown configuration
export const instructorsMenu: NavigationMenu = {
  title: "For Instructors",
  items: [
    {
      title: "For CFI/CFII",
      description: "Tools and resources for Certified Flight Instructors",
      href: "/instructors/cfi",
    },
    {
      title: "Our Mission",
      description: "Learn about our commitment to aviation education",
      href: "/instructors/mission",
    },
    {
      title: "Our Principles",
      description: "The core values that guide our platform",
      href: "/instructors/principles",
    },
  ],
};

// Research dropdown configuration
export const researchMenu: NavigationMenu = {
  title: "Research",
  items: [
    {
      title: "ACS Publications",
      description: "Access to all 18 official FAA ACS documents",
      href: "/research/acs",
    },
    {
      title: "Test Statistics",
      description: "Comprehensive data on Knowledge Test performance",
      href: "/research/statistics",
    },
    {
      title: "Learning Analytics",
      description: "Insights into effective study patterns",
      href: "/research/analytics",
    },
  ],
};

// Flight Schools dropdown configuration
export const flightSchoolsMenu: NavigationMenu = {
  title: "For Flight Schools",
  items: [
    {
      title: "Institutional Access",
      description: "Bulk licensing and management tools",
      href: "/schools/access",
    },
    {
      title: "Student Progress",
      description: "Monitor student performance across your program",
      href: "/schools/progress",
    },
    {
      title: "Custom Integration",
      description: "API access and white-label solutions",
      href: "/schools/integration",
    },
  ],
};

// All navigation menus
export const navigationMenus = {
  features: featuresMenu,
  instructors: instructorsMenu,
  research: researchMenu,
  flightSchools: flightSchoolsMenu,
};

// Mobile navigation items
export const mobileNavigationItems = [
  { label: "Research", href: "/research" },
  { label: "For Flight Schools", href: "/schools" },
];
