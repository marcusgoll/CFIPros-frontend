"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center space-x-3">
              <Image
                src="/images/CFIPros-logo-primary.svg"
                alt="CFIPros Logo"
                width={120}
                height={36}
                className="h-9 w-auto brightness-0 invert"
              />
            </div>
            <p className="mb-4 text-sm text-gray-300">
              Comprehensive pilot training platform helping student pilots and
              CFIs master aviation standards with AI-powered study plans and
              premium content.
            </p>

            {/* Theme Toggle */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-200">Theme</p>
              <div className="flex space-x-1 rounded-lg bg-gray-800 p-1">
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center space-x-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === "system"
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  <span>System</span>
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center space-x-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === "light"
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center space-x-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Moon className="h-3 w-3" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/acs"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  ACS Code Database
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Upload Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/lessons"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Premium Lessons
                </Link>
              </li>
              <li>
                <Link
                  href="/study-plans"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Study Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/api/docs"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="text-sm text-gray-300 transition-colors hover:text-white"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
            {/* Copyright */}
            <p className="order-2 text-sm text-gray-300 lg:order-1">
              © {new Date().getFullYear()} CFIPros. All rights reserved.
            </p>

            {/* Legal Links - Center */}
            <div className="order-1 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:order-2">
              <Link
                href="/cookies"
                className="text-sm text-gray-300 transition-colors hover:text-white"
              >
                Cookies
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-300 transition-colors hover:text-white"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-300 transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/security"
                className="text-sm text-gray-300 transition-colors hover:text-white"
              >
                Security
              </Link>
              <Link
                href="/sitemap"
                className="text-sm text-gray-300 transition-colors hover:text-white"
              >
                Sitemap
              </Link>
            </div>

            {/* Social Links - Right */}
            <div className="order-3 flex space-x-4">
              <a
                href="https://twitter.com/cfipros"
                className="text-gray-300 transition-colors hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/cfipros"
                className="text-gray-300 transition-colors hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/cfipros"
                className="text-gray-300 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/cfipros"
                className="text-gray-300 transition-colors hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/cfipros"
                className="text-gray-300 transition-colors hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
