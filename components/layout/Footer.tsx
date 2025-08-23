import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-bold">CFIPros</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Comprehensive pilot training platform helping student pilots and CFIs 
              master aviation standards with AI-powered study plans and premium content.
            </p>
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
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ACS Code Database
                </Link>
              </li>
              <li>
                <Link 
                  href="/upload" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Upload Reports
                </Link>
              </li>
              <li>
                <Link 
                  href="/lessons" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Premium Lessons
                </Link>
              </li>
              <li>
                <Link 
                  href="/study-plans" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
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
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/api/docs" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
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
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/security" 
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CFIPros. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
                aria-label="Twitter"
              >
                Twitter
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
                aria-label="GitHub"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}