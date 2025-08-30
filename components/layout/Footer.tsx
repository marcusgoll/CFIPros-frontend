"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Github, Facebook, Instagram, Monitor, Sun, Moon } from "lucide-react";
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
            <div className="flex items-center space-x-3 mb-4">
              <Image 
                src="/images/CFIPros-logo-primary.svg"
                alt="CFIPros Logo"
                width={120}
                height={36}
                className="h-9 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Comprehensive pilot training platform helping student pilots and CFIs 
              master aviation standards with AI-powered study plans and premium content.
            </p>
            
            {/* Theme Toggle */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-200">Theme</p>
              <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setTheme("system")}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
                  className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
                  className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/acs" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  ACS Code Database
                </Link>
              </li>
              <li>
                <Link 
                  href="/upload" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Upload Reports
                </Link>
              </li>
              <li>
                <Link 
                  href="/lessons" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Premium Lessons
                </Link>
              </li>
              <li>
                <Link 
                  href="/study-plans" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Study Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/help" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/api/docs" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/security" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link 
                  href="/cookies" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/sitemap" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            {/* Copyright */}
            <p className="text-gray-300 text-sm order-2 lg:order-1">
              © {new Date().getFullYear()} CFIPros. All rights reserved.
            </p>
            
            {/* Legal Links - Center */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 order-1 lg:order-2">
              <Link 
                href="/cookies" 
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Cookies
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/privacy" 
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/security" 
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Security
              </Link>
              <Link 
                href="/sitemap" 
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Sitemap
              </Link>
            </div>

            {/* Social Links - Right */}
            <div className="flex space-x-4 order-3">
              <a 
                href="https://twitter.com/cfipros" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com/company/cfipros" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com/cfipros" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com/cfipros" 
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/cfipros" 
                className="text-gray-300 hover:text-white transition-colors"
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