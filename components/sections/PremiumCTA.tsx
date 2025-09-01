"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRightCircle } from "lucide-react";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function PremiumCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-primary p-12 text-center md:p-16"
        >
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to accelerate your training?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90">
              Join thousands of pilots who are training smarter, not harder
            </p>
            <Link href="/upload">
              <PremiumButton
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightCircle className="h-5 w-5" />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Start your free analysis
              </PremiumButton>
            </Link>
            <p className="mt-4 text-sm text-white/70">
              No credit card required • 5-minute setup
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
