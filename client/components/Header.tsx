import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut, LogIn, User } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Mock user state - will be replaced with Firebase auth
  const isLoggedIn = false;

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline">
              FreeMediaBuzz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/browse" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Browse Media
            </Link>
            <Link 
              to="/categories" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Categories
            </Link>
            <a 
              href="#pricing" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              How It Works
            </a>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Desktop Auth Buttons */}
            {!isLoggedIn ? (
              <div className="hidden sm:flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="hidden sm:relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-secondary/10 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm hover:bg-secondary/10 transition-colors"
                    >
                      Admin Panel
                    </Link>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border">
            <Link
              to="/browse"
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              Browse Media
            </Link>
            <Link
              to="/categories"
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              Categories
            </Link>
            <a
              href="#pricing"
              className="block px-4 py-2 text-sm font-medium hover:bg-secondary/10 transition-colors"
            >
              How It Works
            </a>
            {!isLoggedIn && (
              <div className="flex gap-2 px-4 py-3 border-t border-border">
                <Link
                  to="/login"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center border border-primary text-primary rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 px-4 py-2 text-sm font-medium text-center bg-gradient-to-r from-primary to-accent text-white rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
