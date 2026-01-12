"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { listeDiffusionApi, projetApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/motion/fade-in"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface ListeDiffusion {
  idListeDiffusion: number
  nom: string
  email: string
  description?: string
  nombreAbonnes: number
  statut: string
  dateCreation?: string
}

export default function MailingListsContent() {
  const router = useRouter()
  const [lists, setLists] = useState<ListeDiffusion[]>([])
  const [filtered, setFiltered] = useState<ListeDiffusion[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Projects for optional association in create modal
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  // Modal for creating a new list
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newList, setNewList] = useState<any>({ nom: "", email: "", description: "", statut: "ACTIF", typeAcces: "PRIVE", autorisationEnvoi: "MEMBRES" })

  useEffect(() => {
    const normalize = (i: any) => ({
      idListeDiffusion: i.id ?? i.idListeDiffusion,
      nom: i.nom,
      email: i.email,
      description: i.description,
      nombreAbonnes: i.nombreMembres ?? i.nombreAbonnes ?? 0,
      statut: i.statut ?? (i.active ? "ACTIF" : "INACTIF"),
      active: typeof i.active === "boolean" ? i.active : (i.statut === "ACTIF"),
      dateCreation: i.dateCreation,
    })

    const fetchLists = async () => {
      try {
        setIsLoading(true)
        const data = await listeDiffusionApi.getAll()
        const items = Array.isArray(data) ? data : data?.data || []
        setLists(items.map(normalize))
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Échec du chargement des listes de diffusion")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [])

  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    let out = lists

    if (searchQuery) {
      out = out.filter(
        (l) => l.nom.toLowerCase().includes(searchQuery.toLowerCase()) || (l.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter) {
      out = out.filter((l) => l.statut === statusFilter)
    }

    setFiltered(out)
  }, [lists, searchQuery, statusFilter])

  // Prefill name and email from the current user when opening the create modal
  useEffect(() => {
    if (isModalOpen && user) {
      setNewList((prev: any) => ({
        ...prev,
        nom: prev.nom || user.fullName || `${(user.prenom || "").trim()} ${(user.nom || "").trim()}`.trim(),
        email: prev.email || user.email || "",
      }))
    }

    // Fetch projects when opening the modal so user can associate the list to an existing project
    if (isModalOpen) {
      ;(async () => {
        try {
          setProjectsLoading(true)
          const data = await projetApi.getAll()
          const items = Array.isArray(data) ? data : data?.data || []
          setProjects(items)
        } catch (err) {
          console.error("Failed to fetch projects for list creation:", err)
        } finally {
          setProjectsLoading(false)
        }
      })()
    }
  }, [isModalOpen, user])

  const handleCreate = async () => {
    if (!newList.nom) return toast({ title: "Nom requis", description: "Veuillez saisir un nom pour la liste." })
    if (!user || !user.id) return toast({ title: "Utilisateur non connecté", description: "Impossible de créer la liste sans un utilisateur connecté." })

    try {
      const payload: any = {
        // only include email/description when present (omit nulls)
        nom: newList.nom,
        email: newList.email || undefined,
        description: newList.description || undefined,
        active: newList.statut === "ACTIF",
        // backend expects `type` (not `typeAcces`) — include both for compatibility
        type: newList.typeAcces,
        typeAcces: newList.typeAcces,
        autorisationEnvoi: newList.autorisationEnvoi,
        // include projetId if specified in the form/context
        ...(newList.projetId ? { projetId: Number(newList.projetId) } : {}),
      }

      // ensure creator info is present in multiple shapes to satisfy backend expectations
      const creatorId = Number(user.id)
      payload.idCreateur = creatorId
      payload.createurId = creatorId
      payload.createur = {
        id: creatorId,
        nom: user.nom ?? undefined,
        prenom: user.prenom ?? undefined,
        email: user.email ?? undefined,
      }

      // Strip undefined/null values to avoid sending accidental null ids
      const sanitizedPayload: any = {}
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) sanitizedPayload[k] = v
      })

      console.debug("Creating liste payload (sanitized):", JSON.stringify(sanitizedPayload))
      const created = await listeDiffusionApi.create(sanitizedPayload)
      const raw = Array.isArray(created) ? created[0] : created
      const item = {
        idListeDiffusion: raw.id ?? raw.idListeDiffusion,
        nom: raw.nom,
        email: raw.email,
        description: raw.description,
        nombreAbonnes: raw.nombreMembres ?? raw.nombreAbonnes ?? 0,
        statut: raw.statut ?? (raw.active ? "ACTIF" : "INACTIF"),
        active: typeof raw.active === "boolean" ? raw.active : (raw.statut === "ACTIF"),
        dateCreation: raw.dateCreation,
      }

      setLists([item, ...lists])
      toast({ title: "Liste créée", description: `${item.nom} a été créée.` })
      setIsModalOpen(false)
      setNewList({ nom: "", email: "", description: "", statut: "ACTIF", typeAcces: "PRIVE", autorisationEnvoi: "MEMBRES" })
    } catch (err: any) {
      console.error("Create liste error:", err)
      const serverMsg = err?.body ? (typeof err.body === "string" ? err.body : JSON.stringify(err.body)) : err?.message
      toast({ title: "Erreur", description: serverMsg || "Impossible de créer la liste." })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Confirmer la suppression de cette liste ?")) return
    try {
      await listeDiffusionApi.delete(id)
      setLists((prev) => prev.filter((l) => l.idListeDiffusion !== id))
      toast({ title: "Supprimé", description: "La liste a été supprimée." })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer la liste." })
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const target = lists.find((l) => l.idListeDiffusion === id)
      if (!target) return
      const newActive = !(target.active ?? (target.statut === "ACTIF"))
      await listeDiffusionApi.update(id, { active: newActive })
      setLists((prev) => prev.map((l) => (l.idListeDiffusion === id ? { ...l, statut: newActive ? "ACTIF" : "INACTIF", active: newActive } : l)))
      toast({ title: "Mis à jour", description: `Statut mis à jour: ${newActive ? 'ACTIF' : 'INACTIF'}` })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Erreur", description: err?.message || "Impossible de mettre à jour le statut." })
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listes de Diffusion</h1>
          <p className="text-muted-foreground">Gérez vos listes, abonné·e·s et détails depuis cet espace.</p>
        </div>

        {/* Create modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 h-11 px-6 rounded-xl">Nouvelle Liste</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle liste de diffusion</DialogTitle>
              <DialogDescription>Renseignez les informations de la nouvelle liste. Le créateur sera renseigné automatiquement.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label>Nom</Label>
                <Input value={newList.nom} onChange={(e) => setNewList({ ...newList, nom: e.target.value })} />
              </div>

              <div>
                <Label>Email</Label>
                <Input value={newList.email} onChange={(e) => setNewList({ ...newList, email: e.target.value })} />
              </div>

              <div>
                <Label>Description</Label>
                <Input value={newList.description} onChange={(e) => setNewList({ ...newList, description: e.target.value })} />
              </div>

              <div>
                <Label>Associer à un projet (optionnel)</Label>
                <Select
                  value={newList.projetId ? String(newList.projetId) : "none"}
                  onValueChange={(val) => setNewList({ ...newList, projetId: val === "none" ? undefined : Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={projectsLoading ? "Chargement..." : "Aucun projet"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nomLong || p.nomCourt || `Projet ${p.id}`} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Type d'accès</Label>
                  <Select value={newList.typeAcces} onValueChange={(val) => setNewList({ ...newList, typeAcces: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type d'accès" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVE">Privé</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Autorisation envoi</Label>
                  <Select value={newList.autorisationEnvoi} onValueChange={(val) => setNewList({ ...newList, autorisationEnvoi: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Autorisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">Tous</SelectItem>
                      <SelectItem value="MEMBRES">Membres</SelectItem>
                      <SelectItem value="ADMINISTRATEURS">Administrateurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 flex-col md:flex-row items-center">
        <div className="w-full md:flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Rechercher une liste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 h-11 rounded-xl border border-border/50 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none w-full"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </div>
        </div>
      </div>

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
      ) : filtered.length === 0 ? (
        <FadeIn direction="up">
          <Card className="border-dashed border-2 bg-secondary/10">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune liste trouvée</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Nous n'avons trouvé aucune liste correspondant à vos critères. Essayez de modifier vos filtres ou créez une nouvelle liste.
              </p>
              <Button className="rounded-xl px-8" onClick={() => setIsModalOpen(true)}>
                Créer une nouvelle liste
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((list, index) => (
              <motion.div
                key={list.idListeDiffusion}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, delay: index * 0.03 }}
              >
                {list.idListeDiffusion ? (
                  <Link href={`/dashboard/mailing-lists/${list.idListeDiffusion}`}>
                    <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 overflow-hidden h-full flex flex-col">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{list.nom}</CardTitle>
                            <CardDescription className="line-clamp-1">{list.email}</CardDescription>
                          </div>
                          <Badge variant={list.statut === "ACTIF" ? "default" : "secondary"}>{list.statut}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">{list.description || "Aucune description."}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Users className="w-3.5 h-3.5" />
                              <span>{list.nombreAbonnes}</span>
                            </div>
                            <div className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex gap-3">
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(list.idListeDiffusion) }} className="text-xs">
                                {list.statut === "ACTIF" ? "Désactiver" : "Activer"}
                              </button>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(list.idListeDiffusion) }} className="text-xs text-red-500">
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <div className="border-border/50 overflow-hidden h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-bold transition-colors line-clamp-1">{list.nom}</CardTitle>
                          <CardDescription className="line-clamp-1">{list.email}</CardDescription>
                        </div>
                        <Badge variant={list.statut === "ACTIF" ? "default" : "secondary"}>{list.statut}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">{list.description || "Aucune description."}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{list.nombreAbonnes}</span>
                          </div>
                          <div className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex gap-3">
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(list.idListeDiffusion) }} className="text-xs">
                              {list.statut === "ACTIF" ? "Désactiver" : "Activer"}
                            </button>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(list.idListeDiffusion) }} className="text-xs text-red-500">
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
