import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import ACSSearchClient from "./search-client";
import type { ACSCode } from "@/lib/types";

export const metadata: Metadata = {
  title: "ACS Code Database - Browse Aviation Standards | CFIPros",
  description:
    "Browse and search through 200+ Airman Certification Standards (ACS) codes. Find detailed explanations, common pitfalls, and study resources for pilot training and checkride preparation.",
  keywords: [
    "ACS codes",
    "Airman Certification Standards",
    "pilot training",
    "aviation standards",
    "checkride preparation",
    "flight training",
    "CFI training",
    "aviation education",
  ],
  openGraph: {
    title: "ACS Code Database - Browse Aviation Standards",
    description:
      "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
    type: "website",
    url: "/acs",
    siteName: "CFIPros",
    images: [
      {
        url: "/og-acs-index.png",
        width: 1200,
        height: 630,
        alt: "CFIPros ACS Code Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACS Code Database - Browse Aviation Standards",
    description:
      "Browse and search through 200+ Airman Certification Standards codes with detailed explanations and study resources.",
    images: ["/twitter-acs-index.png"],
  },
  alternates: {
    canonical: "/acs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Mock data for static generation - will be replaced with API calls
const mockACSCodes: ACSCode[] = [
  // Preflight Preparation
  {
    code: "PA.I.A.K1",
    title: "Pilot Qualifications",
    area: "Preflight Preparation",
    task: "Pilot Qualifications",
    element: "Certification requirements",
    description:
      "Understanding pilot certification requirements, including certificates and ratings.",
  },
  {
    code: "PA.I.A.K2",
    title: "Currency Requirements",
    area: "Preflight Preparation",
    task: "Pilot Qualifications",
    element: "Currency and proficiency",
    description:
      "Recent flight experience and proficiency requirements for pilots.",
  },
  {
    code: "PA.I.B.K1",
    title: "Airworthiness Requirements",
    area: "Preflight Preparation",
    task: "Airworthiness Requirements",
    element: "Required certificates and documents",
    description:
      "Knowledge of required aircraft certificates and documents for airworthiness.",
  },
  {
    code: "PA.I.B.K2",
    title: "Weather Information",
    area: "Preflight Preparation",
    task: "Weather Information",
    element: "Weather reports and forecasts",
    description:
      "Understanding weather services, reports, and forecasts for flight planning.",
  },
  {
    code: "PA.I.B.K3",
    title: "Cross-Country Flight Planning",
    area: "Preflight Preparation",
    task: "Cross-Country Flight Planning",
    element: "Route planning",
    description:
      "Planning cross-country flights including fuel requirements and alternate airports.",
  },
  {
    code: "PA.I.C.K1",
    title: "National Airspace System",
    area: "Preflight Preparation",
    task: "National Airspace System",
    element: "Airspace classification",
    description:
      "Knowledge of different airspace classifications and operating requirements.",
  },
  {
    code: "PA.I.D.K1",
    title: "Performance and Limitations",
    area: "Preflight Preparation",
    task: "Performance and Limitations",
    element: "Weight and balance",
    description:
      "Aircraft weight and balance calculations and performance limitations.",
  },
  {
    code: "PA.I.E.K1",
    title: "Operation of Systems",
    area: "Preflight Preparation",
    task: "Operation of Systems",
    element: "Aircraft systems",
    description:
      "Understanding of primary and secondary aircraft systems operation.",
  },
  {
    code: "PA.I.F.K1",
    title: "Human Factors",
    area: "Preflight Preparation",
    task: "Human Factors",
    element: "Aeronautical decision making",
    description:
      "Human factors affecting pilot performance and decision making.",
  },
  {
    code: "PA.I.G.K1",
    title: "Water and Seaplane Characteristics",
    area: "Preflight Preparation",
    task: "Water and Seaplane Characteristics",
    element: "Seaplane operations",
    description:
      "Characteristics and operational considerations for seaplane operations.",
  },

  // Preflight Procedures
  {
    code: "PA.II.A.K1",
    title: "Preflight Assessment",
    area: "Preflight Procedures",
    task: "Preflight Assessment",
    element: "Pilot readiness",
    description: "Assessing pilot fitness and readiness for flight operations.",
  },
  {
    code: "PA.II.B.K1",
    title: "Flight Deck Management",
    area: "Preflight Procedures",
    task: "Flight Deck Management",
    element: "Cockpit organization",
    description: "Proper organization and management of flight deck resources.",
  },
  {
    code: "PA.II.C.K1",
    title: "Engine Starting",
    area: "Preflight Procedures",
    task: "Engine Starting",
    element: "Start procedures",
    description: "Proper engine starting procedures and safety considerations.",
  },
  {
    code: "PA.II.D.K1",
    title: "Taxiing",
    area: "Preflight Procedures",
    task: "Taxiing",
    element: "Ground operations",
    description: "Safe taxiing procedures and airport ground operations.",
  },
  {
    code: "PA.II.E.K1",
    title: "Before Takeoff Check",
    area: "Preflight Procedures",
    task: "Before Takeoff Check",
    element: "Pre-takeoff procedures",
    description: "Systematic before takeoff checks and procedures.",
  },

  // Airport Operations
  {
    code: "PA.III.A.K1",
    title: "Communications and Light Signals",
    area: "Airport Operations",
    task: "Communications and Light Signals",
    element: "Radio communications",
    description: "Proper radio communications and light signal procedures.",
  },
  {
    code: "PA.III.B.K1",
    title: "Traffic Patterns",
    area: "Airport Operations",
    task: "Traffic Patterns",
    element: "Pattern procedures",
    description: "Standard traffic pattern procedures and position reporting.",
  },
  {
    code: "PA.III.C.K1",
    title: "Airport, Runway, and Taxiway Signs",
    area: "Airport Operations",
    task: "Airport, Runway, and Taxiway Signs",
    element: "Airport signage",
    description: "Understanding airport signs, markings, and lighting systems.",
  },

  // Takeoffs, Landings, and Go-Arounds
  {
    code: "PA.IV.A.K1",
    title: "Normal Takeoff and Climb",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Normal Takeoff and Climb",
    element: "Takeoff procedures",
    description: "Normal takeoff and initial climb procedures.",
  },
  {
    code: "PA.IV.B.K1",
    title: "Crosswind Takeoff and Climb",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Crosswind Takeoff and Climb",
    element: "Crosswind techniques",
    description: "Crosswind takeoff techniques and wind correction methods.",
  },
  {
    code: "PA.IV.C.K1",
    title: "Short-Field Takeoff and Climb",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Short-Field Takeoff and Climb",
    element: "Performance takeoff",
    description:
      "Short-field takeoff and maximum performance climb procedures.",
  },
  {
    code: "PA.IV.D.K1",
    title: "Soft-Field Takeoff and Climb",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Soft-Field Takeoff and Climb",
    element: "Soft surface operations",
    description: "Soft-field takeoff techniques for unpaved surfaces.",
  },
  {
    code: "PA.IV.E.K1",
    title: "Normal Approach and Landing",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Normal Approach and Landing",
    element: "Landing procedures",
    description: "Normal approach and landing procedures and techniques.",
  },
  {
    code: "PA.IV.F.K1",
    title: "Crosswind Approach and Landing",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Crosswind Approach and Landing",
    element: "Crosswind landing",
    description: "Crosswind approach and landing techniques.",
  },
  {
    code: "PA.IV.G.K1",
    title: "Short-Field Approach and Landing",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Short-Field Approach and Landing",
    element: "Precision approach",
    description: "Short-field approach and landing for maximum performance.",
  },
  {
    code: "PA.IV.H.K1",
    title: "Soft-Field Approach and Landing",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Soft-Field Approach and Landing",
    element: "Soft surface landing",
    description: "Soft-field approach and landing techniques.",
  },
  {
    code: "PA.IV.I.K1",
    title: "Go-Around/Rejected Landing",
    area: "Takeoffs, Landings, and Go-Arounds",
    task: "Go-Around/Rejected Landing",
    element: "Go-around procedures",
    description:
      "Go-around and rejected landing procedures and decision making.",
  },

  // Performance and Ground Reference Maneuvers
  {
    code: "PA.V.A.K1",
    title: "Steep Turns",
    area: "Performance and Ground Reference Maneuvers",
    task: "Steep Turns",
    element: "Steep turn technique",
    description: "Steep turn procedures maintaining altitude and airspeed.",
  },
  {
    code: "PA.V.B.K1",
    title: "Ground Reference Maneuvers",
    area: "Performance and Ground Reference Maneuvers",
    task: "Ground Reference Maneuvers",
    element: "Wind correction",
    description:
      "Ground reference maneuvers with proper wind correction techniques.",
  },

  // Navigation
  {
    code: "PA.VI.A.K1",
    title: "Pilotage and Dead Reckoning",
    area: "Navigation",
    task: "Pilotage and Dead Reckoning",
    element: "Visual navigation",
    description:
      "Visual navigation using pilotage and dead reckoning techniques.",
  },
  {
    code: "PA.VI.B.K1",
    title: "Navigation Systems and Radar Services",
    area: "Navigation",
    task: "Navigation Systems and Radar Services",
    element: "Electronic navigation",
    description:
      "Use of navigation systems including VOR, GPS, and radar services.",
  },
  {
    code: "PA.VI.C.K1",
    title: "Diversion",
    area: "Navigation",
    task: "Diversion",
    element: "Route changes",
    description: "Planning and executing course diversions during flight.",
  },
  {
    code: "PA.VI.D.K1",
    title: "Lost Procedures",
    area: "Navigation",
    task: "Lost Procedures",
    element: "Position recovery",
    description: "Procedures for regaining position awareness when lost.",
  },

  // Slow Flight and Stalls
  {
    code: "PA.VII.A.K1",
    title: "Maneuvering During Slow Flight",
    area: "Slow Flight and Stalls",
    task: "Maneuvering During Slow Flight",
    element: "Slow flight control",
    description:
      "Aircraft control and maneuvering at minimum controllable airspeeds.",
  },
  {
    code: "PA.VII.B.K1",
    title: "Power-Off Stalls",
    area: "Slow Flight and Stalls",
    task: "Power-Off Stalls",
    element: "Stall recognition",
    description: "Recognition and recovery from power-off stall situations.",
  },
  {
    code: "PA.VII.C.K1",
    title: "Power-On Stalls",
    area: "Slow Flight and Stalls",
    task: "Power-On Stalls",
    element: "Departure stalls",
    description: "Recognition and recovery from power-on stall situations.",
  },
  {
    code: "PA.VII.D.K1",
    title: "Spin Awareness",
    area: "Slow Flight and Stalls",
    task: "Spin Awareness",
    element: "Spin prevention",
    description: "Spin awareness, prevention, and recovery procedures.",
  },

  // Basic Instrument Maneuvers
  {
    code: "PA.VIII.A.K1",
    title: "Straight-and-Level Flight",
    area: "Basic Instrument Maneuvers",
    task: "Straight-and-Level Flight",
    element: "Instrument flight",
    description:
      "Maintaining straight and level flight using flight instruments.",
  },
  {
    code: "PA.VIII.B.K1",
    title: "Constant Airspeed Climbs",
    area: "Basic Instrument Maneuvers",
    task: "Constant Airspeed Climbs",
    element: "Instrument climbs",
    description: "Constant airspeed climbs using instrument references.",
  },
  {
    code: "PA.VIII.C.K1",
    title: "Constant Airspeed Descents",
    area: "Basic Instrument Maneuvers",
    task: "Constant Airspeed Descents",
    element: "Instrument descents",
    description: "Constant airspeed descents using instrument references.",
  },
  {
    code: "PA.VIII.D.K1",
    title: "Turns to Headings",
    area: "Basic Instrument Maneuvers",
    task: "Turns to Headings",
    element: "Instrument turns",
    description: "Turning to specific headings using instrument references.",
  },
  {
    code: "PA.VIII.E.K1",
    title: "Recovery from Unusual Flight Attitudes",
    area: "Basic Instrument Maneuvers",
    task: "Recovery from Unusual Flight Attitudes",
    element: "Unusual attitude recovery",
    description: "Recognition and recovery from unusual flight attitudes.",
  },

  // Emergency Operations
  {
    code: "PA.IX.A.K1",
    title: "Emergency Descent",
    area: "Emergency Operations",
    task: "Emergency Descent",
    element: "Rapid descent",
    description: "Emergency descent procedures for cabin pressurization loss.",
  },
  {
    code: "PA.IX.B.K1",
    title: "Emergency Approach and Landing",
    area: "Emergency Operations",
    task: "Emergency Approach and Landing",
    element: "Forced landing",
    description:
      "Emergency approach and landing procedures for engine failure.",
  },
  {
    code: "PA.IX.C.K1",
    title: "Systems and Equipment Malfunctions",
    area: "Emergency Operations",
    task: "Systems and Equipment Malfunctions",
    element: "System failures",
    description:
      "Procedures for handling various aircraft system malfunctions.",
  },
  {
    code: "PA.IX.D.K1",
    title: "Emergency Equipment and Survival Gear",
    area: "Emergency Operations",
    task: "Emergency Equipment and Survival Gear",
    element: "Emergency equipment",
    description: "Use of emergency equipment and survival gear.",
  },

  // Night Operations (if applicable)
  {
    code: "PA.X.A.K1",
    title: "Night Preparation",
    area: "Night Operations",
    task: "Night Preparation",
    element: "Night planning",
    description: "Special considerations for night flight operations.",
  },
  {
    code: "PA.X.B.K1",
    title: "Night Flight",
    area: "Night Operations",
    task: "Night Flight",
    element: "Night vision",
    description: "Night flight operations and vision considerations.",
  },

  // High Altitude Operations (if applicable)
  {
    code: "PA.XI.A.K1",
    title: "Supplemental Oxygen",
    area: "High Altitude Operations",
    task: "Supplemental Oxygen",
    element: "Oxygen requirements",
    description: "Supplemental oxygen requirements and physiological factors.",
  },
  {
    code: "PA.XI.B.K1",
    title: "Pressurization",
    area: "High Altitude Operations",
    task: "Pressurization",
    element: "Cabin pressure",
    description: "Aircraft pressurization systems and emergency procedures.",
  },

  // Additional Commercial Pilot Areas
  {
    code: "CA.I.A.K1",
    title: "Commercial Pilot Privileges",
    area: "Commercial Operations",
    task: "Commercial Pilot Privileges",
    element: "Operating privileges",
    description: "Commercial pilot privileges and limitations.",
  },
  {
    code: "CA.I.B.K1",
    title: "Complex Aircraft Operations",
    area: "Commercial Operations",
    task: "Complex Aircraft Operations",
    element: "Retractable gear",
    description:
      "Operations of complex aircraft with retractable landing gear.",
  },
  {
    code: "CA.II.A.K1",
    title: "Chandelle",
    area: "Commercial Maneuvers",
    task: "Chandelle",
    element: "Maximum performance",
    description: "Chandelle maneuver for maximum performance climb.",
  },
  {
    code: "CA.II.B.K1",
    title: "Lazy Eight",
    area: "Commercial Maneuvers",
    task: "Lazy Eight",
    element: "Coordination maneuver",
    description: "Lazy eight maneuver for coordination and aircraft control.",
  },
  {
    code: "CA.II.C.K1",
    title: "Eights on Pylons",
    area: "Commercial Maneuvers",
    task: "Eights on Pylons",
    element: "Pylon eights",
    description: "Eights on pylons maneuver maintaining pivotal altitude.",
  },

  // Instrument Rating Areas
  {
    code: "IR.I.A.K1",
    title: "Instrument Flight Rules",
    area: "Instrument Procedures",
    task: "Instrument Flight Rules",
    element: "IFR regulations",
    description: "Instrument flight rules and regulatory requirements.",
  },
  {
    code: "IR.I.B.K1",
    title: "Instrument Approach Procedures",
    area: "Instrument Procedures",
    task: "Instrument Approach Procedures",
    element: "Approach categories",
    description: "Various instrument approach procedures and categories.",
  },
  {
    code: "IR.II.A.K1",
    title: "Precision Approaches",
    area: "Instrument Approaches",
    task: "Precision Approaches",
    element: "ILS approaches",
    description: "Precision instrument approaches including ILS procedures.",
  },
  {
    code: "IR.II.B.K1",
    title: "Non-Precision Approaches",
    area: "Instrument Approaches",
    task: "Non-Precision Approaches",
    element: "VOR/GPS approaches",
    description: "Non-precision approaches including VOR and GPS procedures.",
  },
  {
    code: "IR.III.A.K1",
    title: "Holding Procedures",
    area: "Instrument Navigation",
    task: "Holding Procedures",
    element: "Hold entries",
    description: "Holding patterns and proper entry procedures.",
  },

  // CFI Areas
  {
    code: "CFI.I.A.K1",
    title: "Fundamentals of Instructing",
    area: "Instructional Knowledge",
    task: "Fundamentals of Instructing",
    element: "Learning process",
    description:
      "Understanding the learning process and effective instruction techniques.",
  },
  {
    code: "CFI.I.B.K1",
    title: "Technical Subject Areas",
    area: "Instructional Knowledge",
    task: "Technical Subject Areas",
    element: "Aeronautical knowledge",
    description: "Technical knowledge areas for flight instruction.",
  },
  {
    code: "CFI.II.A.K1",
    title: "Preflight Lesson",
    area: "Flight Instruction",
    task: "Preflight Lesson",
    element: "Ground instruction",
    description:
      "Conducting effective preflight lessons and ground instruction.",
  },
  {
    code: "CFI.II.B.K1",
    title: "Preflight Procedures",
    area: "Flight Instruction",
    task: "Preflight Procedures",
    element: "Student demonstration",
    description: "Teaching preflight procedures to student pilots.",
  },
];

export default function ACSIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ACS Code Database
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Browse and search through 200+ Airman Certification Standards
              codes
            </p>
          </div>

          {/* Interactive Search Component */}
          <ACSSearchClient />
        </div>
      </div>

      {/* Static Results for SEO */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Found {mockACSCodes.length} ACS codes
          </p>
        </div>

        {/* Static Results Grid for SEO */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockACSCodes.map((code) => (
            <Link key={code.code} href={`/acs/${code.code}`}>
              <Card className="h-full cursor-pointer transition-shadow duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="bg-primary-100 text-primary-700 rounded-lg px-3 py-1 text-sm font-medium">
                      {code.code}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {code.title}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                    {code.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {code.area}
                    </span>
                    {code.task && (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {code.task}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Static Pagination for SEO */}
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-400">
              Previous
            </span>
            <span className="border-primary-600 bg-primary-50 text-primary-600 inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium">
              1
            </span>
            <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">
              2
            </span>
            <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">
              3
            </span>
            <span className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">
              Next
            </span>
          </nav>
        </div>
      </div>
    </div>
  );
}
