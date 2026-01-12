"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import useDashboardStats from "@/hooks/use-dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProfileCard from "@/components/dashboard/profile-card"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { FolderOpen, CheckCircle2, Clock, TrendingUp, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { FadeIn } from "@/components/motion/fade-in"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { stats, projectStats, taskStats, isLoading, refresh } = useDashboardStats()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/10"></div>
            </div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Chargement de vos données...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

  const metrics = [
    { 
      title: "Projets Totaux", 
      value: stats.totalProjects, 
      icon: FolderOpen, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      description: "Projets actifs et archivés"
    },
    { 
      title: "Tâches Totales", 
      value: stats.totalTasks, 
      icon: CheckCircle2, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      description: "Toutes les tâches assignées"
    },
    { 
      title: "En Cours", 
      value: stats.inProgressTasks, 
      icon: Clock, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10",
      description: "Tâches en cours de traitement"
    },
    { 
      title: "Terminées", 
      value: stats.completedTasks, 
      icon: TrendingUp, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      description: "Tâches finalisées avec succès"
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Ravi de vous revoir, {user.displayName || user.fullName}. Voici un aperçu de votre activité.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Janvier 2026
          </Button>
          <Button size="sm" className="h-9 shadow-lg shadow-primary/20">
            Nouveau Projet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <FadeIn key={metric.title} delay={index * 0.1} direction="up">
                <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${metric.bg}`}>
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                      <div className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +12%
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <h3 className="text-3xl font-bold mt-1">{metric.value}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            <FadeIn delay={0.4} direction="up">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Progression des Tâches</CardTitle>
                  <CardDescription>Visualisation de l'état d'avancement de vos travaux</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={taskStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {taskStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>

        <div className="space-y-8">
          <FadeIn delay={0.2} direction="left">
            <ProfileCard
              user={user}
              totalProjects={stats.totalProjects}
              totalTasks={stats.totalTasks}
              totalGroups={stats.totalGroups}
              score={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
            />
          </FadeIn>

          <FadeIn delay={0.5} direction="left">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Distribution des Projets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {projectStats.map((stat, index) => (
                    <div key={stat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-muted-foreground">{stat.name}</span>
                      </div>
                      <span className="font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
