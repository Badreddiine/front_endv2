
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  LogOut, 
  User, 
  Settings, 
  Menu, 
  X, 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Calendar, 
  Mail, 
  MessageSquare,
  Bell,
  Search,
  ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/motion/fade-in"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const navLinks = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: "Projets", icon: Briefcase },
    { href: "/dashboard/tasks", label: "Tâches", icon: CheckSquare },
    { href: "/dashboard/groups", label: "Groupes", icon: Users },
    { href: "/dashboard/calendar", label: "Calendrier", icon: Calendar },
    { href: "/dashboard/mailing-lists", label: "Listes de diffusion", icon: Mail },
    { href: "/dashboard/chat-rooms", label: "Salons de discussion", icon: MessageSquare },
  ]

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
                </div>
                <span>COLLAB</span>
              </motion.div>
            ) : (
              <motion.div
                key=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto"
              >
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "group-hover:text-primary"}`} />
                  {isSidebarOpen && (
                    <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>
                  )}
                  {isActive && isSidebarOpen && (
                    <motion.div layoutId="active-pill" className="ml-auto">
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full justify-center text-muted-foreground"
          >
            {isSidebarOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4" />}
            {isSidebarOpen && "Réduire"}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="hidden md:flex items-center bg-secondary/50 rounded-full px-3 py-1.5 border border-border w-64">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 py-1 h-auto rounded-full hover:bg-secondary transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left mr-1">
                    <p className="text-xs font-semibold leading-none">{user?.displayName || "Utilisateur"}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate max-w-[100px]">{user?.email}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/20">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <FadeIn direction="up" delay={0.1}>
              {children}
            </FadeIn>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-[60] lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span>ManusApp</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href}>
                      <div
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <link.icon className="w-5 h-5" />
                        <span className="font-medium">{link.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
              <div className="p-4 border-t border-border">
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
