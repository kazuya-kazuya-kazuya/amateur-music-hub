import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Music2, Search, Upload, User, X, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onSearch?: (q: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => logout(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { href: "/", label: "ホーム" },
    { href: "/explore", label: "探索" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-border/50">
      <div className="container">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center neon-glow-purple">
              <Music2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-neon-text hidden sm:block">MusicHub</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="楽曲を検索..."
                className="pl-9 bg-secondary border-border/50 focus:border-primary/50 h-9 text-sm"
              />
            </div>
          </form>

          <div className="flex-1" />

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/upload">
                  <Button size="sm" className="gradient-neon text-white neon-glow-purple border-0 hover:opacity-90">
                    <Upload size={14} className="mr-1.5" />
                    投稿
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full ring-2 ring-border hover:ring-primary/50 transition-all">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {user?.name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`} className="flex items-center gap-2 cursor-pointer">
                        <User size={14} />
                        プロフィール
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut size={14} className="mr-2" />
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="gradient-neon text-white neon-glow-purple border-0 hover:opacity-90"
              >
                <LogIn size={14} className="mr-1.5" />
                ログイン
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-popover/95 backdrop-blur-md">
          <div className="container py-3 flex flex-col gap-2">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="楽曲を検索..."
                className="pl-9 bg-secondary border-border/50 h-9 text-sm"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href="/upload" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full gradient-neon text-white border-0">
                    <Upload size={14} className="mr-1.5" />
                    楽曲を投稿
                  </Button>
                </Link>
                <Link href={`/profile/${user?.id}`} onClick={() => setMobileOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full">
                    <User size={14} className="mr-1.5" />
                    プロフィール
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <LogOut size={14} className="mr-1.5" />
                  ログアウト
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="w-full gradient-neon text-white border-0"
              >
                <LogIn size={14} className="mr-1.5" />
                ログイン
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
