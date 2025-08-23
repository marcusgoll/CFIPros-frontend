import Link from "next/link";
import { ArrowRight, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
              Trusted by 10,000+ pilots nationwide
            </div>
          </div>

          {/* Main heading */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Master Aviation Standards with{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              CFIPros
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-8 text-gray-600">
            Comprehensive pilot training platform that helps student pilots and CFIs 
            master aviation standards with SEO-discoverable ACS code references, 
            AI-powered study plans, and premium lesson content.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <Link href="/upload" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group flex items-center justify-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Report
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/acs" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                Browse ACS Codes
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-primary-600">200+</div>
              <div className="mt-1 text-sm text-gray-600">ACS Codes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">95%</div>
              <div className="mt-1 text-sm text-gray-600">Pass Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">10k+</div>
              <div className="mt-1 text-sm text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">4.9★</div>
              <div className="mt-1 text-sm text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-accent-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
}