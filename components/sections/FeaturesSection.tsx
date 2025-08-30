import Link from "next/link";
import { ArrowRight, Search, Upload, BookOpen, Target, BarChart3, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

const features = [
  {
    icon: Search,
    title: "ACS Code Discovery",
    description: "SEO-optimized pages for 200+ ACS codes with official text, summaries, and common pitfalls.",
    href: "/acs",
    color: "text-primary-600 bg-primary-100",
  },
  {
    icon: Upload,
    title: "Smart Document Analysis",
    description: "Upload exam reports for AI-powered ACS code extraction and personalized study plan generation.",
    href: "/upload",
    color: "text-accent-600 bg-accent-100",
  },
  {
    icon: BookOpen,
    title: "Premium Lessons",
    description: "In-depth lesson content with progress tracking, designed by experienced CFIs and aviation professionals.",
    href: "/auth/register",
    color: "text-success-600 bg-success-100",
  },
  {
    icon: Target,
    title: "Personalized Study Plans",
    description: "AI-generated study plans tailored to your weak areas and learning pace for optimal preparation.",
    href: "/auth/register",
    color: "text-warning-600 bg-warning-100",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your learning progress with detailed analytics and performance insights.",
    href: "/auth/register",
    color: "text-secondary-600 bg-secondary-100",
  },
  {
    icon: Shield,
    title: "Guaranteed Results",
    description: "95% of our users pass their checkrides on the first attempt with our comprehensive preparation.",
    href: "/about",
    color: "text-error-600 bg-error-100",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for flight training success
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From ACS code discovery to personalized study plans, we&apos;ve got you covered 
            throughout your aviation journey.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 group-hover:translate-x-1 transition-transform"
                  >
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}