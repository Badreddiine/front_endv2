"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { tacheApi, projetApi, userApi, type TacheDTO } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, AlertCircle, Clock, CheckCircle2, Calendar, MoreHorizontal, GripVertical, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/motion/fade-in"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TasksContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<TacheDTO[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TacheDTO[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pour modal création tâche
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [newTask, setNewTask] = useState<any>({
    titre: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    priorite: 1,
    difficulte: 1,
    notation: 1,
    etat: "A_FAIRE",
    projet: null,
    assigneA: null,
  })

  // Redirect si pas connecté
  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Fetch tâches
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const data = await tacheApi.getAll()
        setTasks(data || [])
      } catch (err: any) {
        setError(err.message || "Échec du chargement des tâches")
      } finally {
        setIsLoading(false)
      }
    }
    if (user) fetchTasks()
  }, [user])

  // Fetch projets et utilisateurs pour modal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projets, utilisateurs] = await Promise.all([projetApi.getAll(), userApi.getAll()])
        setProjects(projets || [])
        setUsers(utilisateurs || [])
      } catch (err) {
        console.error("Erreur fetch projets/utilisateurs", err)
      }
    }
    fetchData()
  }, [])

  // Filter tasks
  useEffect(() => {
    let filtered = tasks
    if (searchQuery) filtered = filtered.filter((t) => t.titre.toLowerCase().includes(searchQuery.toLowerCase()))
    if (stateFilter) filtered = filtered.filter((t) => t.etat === stateFilter)
    setFilteredTasks(filtered)
  }, [tasks, searchQuery, stateFilter])

  const getPriorityConfig = (priority: number | string) => {
    const map: Record<string, { color: string; label: string }> = {
      "3": { color: "bg-rose-500/10 text-rose-600 border-rose-200", label: "Haute" },
      "2": { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Moyenne" },
      "1": { color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Basse" },
    }
    return map[priority?.toString()] || { color: "bg-slate-500/10 text-slate-600 border-slate-200", label: "N/A" }
  }

  const getStateConfig = (state: string) => {
    switch (state) {
      case "TERMINE": return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Terminé" }
      case "EN_COURS": return { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", label: "En cours" }
      case "A_FAIRE": return { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", label: "À faire" }
      default: return { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-500/10", label: state }
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.titre || !newTask.projet) return
    try {
      const payload = {
        ...newTask,
        projet: { id: newTask.projet.id },
        assigneA: newTask.assigneA ? { id: newTask.assigneA.id } : null,
      }
      const created = await tacheApi.create(payload)
      setTasks([created, ...tasks])
      setIsModalOpen(false)
      setNewTask({
        titre: "",
        description: "",
        dateDebut: "",
        dateFin: "",
        priorite: 1,
        difficulte: 1,
        notation: 1,
        etat: "A_FAIRE",
        projet: null,
        assigneA: null,
      })
    } catch (err: any) {
      console.error(err)
      alert("Erreur création tâche : " + err.message)
    }
  }

  if (loading) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Tâches</h1>
          <p className="text-muted-foreground">Organisez et suivez vos tâches quotidiennes.</p>
        </div>

        {/* Bouton Nouvelle Tâche */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 h-11 px-6 rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Tâche
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle tâche</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label>Titre</Label>
                <Input value={newTask.titre} onChange={e => setNewTask({ ...newTask, titre: e.target.value })} />
              </div>

              <div>
                <Label>Description</Label>
                <Input value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Date début</Label>
                  <Input type="date" value={newTask.dateDebut} onChange={e => setNewTask({ ...newTask, dateDebut: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Date fin</Label>
                  <Input type="date" value={newTask.dateFin} onChange={e => setNewTask({ ...newTask, dateFin: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Priorité</Label>
                  <Input type="number" min={1} max={3} value={newTask.priorite} onChange={e => setNewTask({ ...newTask, priorite: parseInt(e.target.value) })} />
                </div>
                <div className="flex-1">
                  <Label>Difficulté</Label>
                  <Input type="number" min={1} max={5} value={newTask.difficulte} onChange={e => setNewTask({ ...newTask, difficulte: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Notation</Label>
                  <Input type="number" min={1} max={5} value={newTask.notation} onChange={e => setNewTask({ ...newTask, notation: parseInt(e.target.value) })} />
                </div>

                <div className="flex-1">
                  <Label>État</Label>
                  <Select value={newTask.etat} onValueChange={val => setNewTask({ ...newTask, etat: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="État" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A_FAIRE">À faire</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="TERMINE">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Projet</Label>
                  <Select
                    value={newTask.projet?.id?.toString() || ""}
                    onValueChange={val => {
                      const projet = projects.find(p => p.id.toString() === val)
                      setNewTask({ ...newTask, projet })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length ? projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.titre}</SelectItem>) : <SelectItem value="">Chargement...</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Assigner à</Label>
                  <Select
                    value={newTask.assigneA?.id?.toString() || ""}
                    onValueChange={val => {
                      const u = users.find(u => u.id.toString() === val)
                      setNewTask({ ...newTask, assigneA: u })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length ? users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.nom} {u.prenom}</SelectItem>) : <SelectItem value="">Chargement...</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateTask}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-4 flex-col md:flex-row items-center">
        <div className="w-full md:flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input type="text" placeholder="Rechercher une tâche..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="pl-9 pr-8 h-11 rounded-xl border border-border/50 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none w-full">
              <option value="">Tous les états</option>
              <option value="A_FAIRE">À faire</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {["A_FAIRE","EN_COURS","TERMINE"].map(state => {
          const stateTasks = filteredTasks.filter(t => t.etat === state)
          const config = getStateConfig(state)
          const Icon = config.icon

          return (
            <div key={state} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{config.label}</h3>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold">{stateTasks.length}</Badge>
              </div>

              <div className="flex-1 space-y-4 min-h-[200px] p-2 rounded-2xl bg-secondary/30 border border-dashed border-border/50">
                <AnimatePresence mode="popLayout">
                  {stateTasks.map((task, index) => {
                    const priority = getPriorityConfig(task.priorite)
                    return (
                      <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: index*0.05 }}>
                        <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 cursor-pointer overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                                <GripVertical className="w-4 h-4"/>
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{task.titre}</h4>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4"/>
                                  </Button>
                                </div>
                                {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                                <div className="flex items-center justify-between pt-2">
                                  <Badge variant="outline" className={`text-[10px] font-bold uppercase px-1.5 py-0 ${priority.color}`}>{priority.label}</Badge>
                                  {task.dateFin && (
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                      <Calendar className="w-3 h-3"/>
                                      <span>{new Date(task.dateFin).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {stateTasks.length === 0 && !isLoading && (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4">
                    <div className={`p-2 rounded-full ${config.bg} mb-2`}>
                      <Icon className={`w-5 h-5 ${config.color} opacity-50`} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Aucune tâche</p>
                  </div>
                )}
                {isLoading && [...Array(2)].map((_,i)=>(
                  <div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse border border-border/50"></div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}