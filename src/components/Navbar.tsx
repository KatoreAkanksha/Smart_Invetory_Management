  import { useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Receipt,
  Users,
  BrainCircuit,
  Wallet,
  LightbulbIcon,
} from "lucide-react";

// Define navigation links for reuse
type NavItem = {
  path: string;
  icon: React.ElementType;
  labelKey: string;
};

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { path: "/expenses", icon: Receipt, labelKey: "expenses" },
  { path: "/budget", icon: Wallet, labelKey: "budget" },
  { path: "/groups", icon: Users, labelKey: "groups" },
  { path: "/advisor", icon: BrainCircuit, labelKey: "advisor" },
];
const Navbar = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Memoized handlers to prevent recreating functions on each render
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Memoized navigation items to prevent recreating on each render
  const navItems = useMemo(() => {
    return NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
      <Link
        key={path}
        to={path}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent",
          location.pathname === path && "bg-accent text-accent-foreground"
        )}
        onClick={closeMobileMenu}
      >
        <Icon className="mr-2 h-4 w-4" />
        {t(labelKey)}
      </Link>
    ));
  }, [location.pathname, t, closeMobileMenu]);

  // Memoized mobile navigation items
  const mobileNavItems = useMemo(() => {
    return NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
      <Link
        key={path}
        to={path}
        className={cn(
          "flex items-center px-4 py-3 hover:bg-accent w-full justify-end",
          location.pathname === path && "bg-accent font-medium text-foreground"
        )}
        onClick={closeMobileMenu}
      >
        <Icon className="mr-2 h-4 w-4" />
        {t(labelKey)}
      </Link>
    ));
  }, [location.pathname, t, closeMobileMenu]);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2"
          onClick={closeMobileMenu}
        >
          <LightbulbIcon className="h-6 w-6 text-primary" />
          <span className="text-primary font-bold text-xl">SmartBudget</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center space-x-1 justify-end">
            {navItems}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <LanguageSelector />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.displayName || "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t("profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-2">
            <nav className="flex flex-col items-end text-right">
              {mobileNavItems}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;

