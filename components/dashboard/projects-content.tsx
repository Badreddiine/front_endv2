
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { projetApi, groupeApi } from "@/lib/api-client"
// using `any` here because backend DTO shape varies
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Clock, Users, CheckCircle2, AlertCircle, Filter, MoreVertical, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/motion/fade-in"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import useDashboardStats from "@/hooks/use-dashboard-stats"
import { Label } from "@/components/ui/label"


export default function ProjectsContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Modal for creating project
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProject, setNewProject] = useState<any>({
    nom: "",
    description: "",
    statut: "EN_ATTENTE",
    groupeId: "",
  })
  const [groups, setGroups] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { refresh: refreshDashboardStats } = useDashboardStats()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const g = await groupeApi.getAll()
        setGroups(g || [])
      } catch (err) {
        console.error("Erreur fetch groupes", err)
      }
    }

    fetchGroups()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const data = await projetApi.getAll()
        setProjects(data || [])
      } catch (err: any) {
        setError(err.message || "Échec du chargement des projets")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProjects()
    }
  }, [user])

  useEffect(() => {
    let filtered = projects

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.statut === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, statusFilter])

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string, label: string, icon: any }> = {
      EN_ATTENTE: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "En attente", icon: Clock },
      ACCEPTE: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Accepté", icon: CheckCircle2 },
      REJETE: { color: "bg-rose-500/10 text-rose-600 border-rose-200", label: "Rejeté", icon: AlertCircle },
      CLOTURE: { color: "bg-slate-500/10 text-slate-600 border-slate-200", label: "Clôturé", icon: CheckCircle2 },
    }
    return configs[status] || { color: "bg-slate-500/10 text-slate-600 border-slate-200", label: status, icon: Clock }
  }

  if (loading) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Projets</h1>
          <p className="text-muted-foreground">Gérez et suivez l'avancement de vos projets en temps réel.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 h-11 px-6 rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Projet
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label>Nom</Label>
                <Input value={newProject.nom} onChange={e => setNewProject({ ...newProject, nom: e.target.value })} />
              </div>

              <div>
                <Label>Description</Label>
                <Input value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
              </div>

              <div>
                <Label>Groupe</Label>
                <select
                  value={newProject.groupeId || ""}
                  onChange={e => setNewProject({ ...newProject, groupeId: e.target.value })}
                  className="w-full h-10 rounded-md border border-border/50 bg-card text-sm px-2"
                >
                  <option value="">-- Aucun (sélectionnez un groupe) --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button disabled={isCreating} onClick={async () => {
                  if (!newProject.nom) return alert("Veuillez saisir un nom de projet.")
                  if (!newProject.groupeId) return alert("Veuillez sélectionner un groupe.")
                  setIsCreating(true)
                  try {
                    const payload = { nom: newProject.nom, description: newProject.description, groupeId: Number(newProject.groupeId) }
                    const created = await projetApi.create(payload, user?.id)
                    setProjects([created, ...projects])
                    // refresh dashboard cards
                    try { await refreshDashboardStats() } catch (e) { /* ignore */ }
                    setIsModalOpen(false)
                    setNewProject({ nom: "", description: "", statut: "EN_ATTENTE", groupeId: "" })
                  } catch (err: any) {
                    console.error("Create project error:", err)
                    const status = err?.status ? ` (status ${err.status})` : ""
                    const body = err?.body ? `\nResponse body: ${JSON.stringify(err.body)}` : ""
                    alert("Erreur création projet" + status + ": " + (err?.message || String(err)) + body)
                  } finally {
                    setIsCreating(false)
                  }
                }}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-col md:flex-row items-center">
        <div className="w-full md:flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 h-11 rounded-xl border border-border/50 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none w-full"
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACCEPTE">Accepté</option>
              <option value="REJETE">Rejeté</option>
              <option value="CLOTURE">Clôturé</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <FadeIn direction="up">
          <Alert variant="destructive" className="bg-rose-500/10 border-rose-200 text-rose-600">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </Alert>
        </FadeIn>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border/50 overflow-hidden">
              <div className="h-2 bg-muted animate-pulse"></div>
              <CardHeader className="space-y-3">
                <div className="h-6 bg-muted rounded-md w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded-md w-full animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded-full w-full animate-pulse"></div>
                  <div className="h-3 bg-muted rounded-full w-2/3 animate-pulse"></div>
                </div>
                <div className="flex justify-between pt-4 border-t border-border/50">
                  <div className="h-4 bg-muted rounded-md w-16 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded-md w-16 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <FadeIn direction="up">
          <Card className="border-dashed border-2 bg-secondary/10">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Nous n'avons trouvé aucun projet correspondant à vos critères. Essayez de modifier vos filtres ou créez un nouveau projet.
              </p>
              <Button className="rounded-xl px-8" onClick={() => setIsModalOpen(true)}>
                Créer mon premier projet
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => {
              const config = getStatusConfig(project.statut)
              const StatusIcon = config.icon
              
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 overflow-hidden h-full flex flex-col">
                      <div className={`h-1.5 w-full ${project.statut === 'ACCEPTE' ? 'bg-emerald-500' : project.statut === 'EN_ATTENTE' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                              {project.nom}
                            </CardTitle>
                            <Badge variant="outline" className={`mt-1 font-medium ${config.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1.5" />
                              {config.label}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/dashboard/projects/${project.id}/edit`)
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                          {project.description || "Aucune description fournie pour ce projet."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                        <div className="space-y-4">
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="text-primary">{project.tauxCompletion}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.tauxCompletion}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full rounded-full ${project.tauxCompletion === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                              ></motion.div>
                            </div>
                          </div>

                          {/* Project Stats */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span>{project.nombreMembres}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{project.nombreTaches}</span>
                              </div>
                            </div>
                            <div className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
