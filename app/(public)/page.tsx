import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      
      {/* CTA Section */}
      <section className="bg-primary-700">
        <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to ace your checkride?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-200">
              Join thousands of pilots who have improved their knowledge and 
              passed their checkrides with CFIPros.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <Link href="/upload" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-50 focus:ring-white"
                >
                  Start free analysis
                </Button>
              </Link>
              <Link href="/acs" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border border-white text-white hover:bg-white hover:text-primary-600 focus:ring-white"
                >
                  Browse ACS codes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}