"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { GroupeDTO, UtilisateurDTO } from "@/lib/types"
import { groupeApi, authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Users, Search, Filter, ArrowRight, Globe, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/motion/fade-in"
import { motion, AnimatePresence } from "framer-motion"

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<GroupeDTO[]>([])
  const [filteredGroupes, setFilteredGroupes] = useState<GroupeDTO[]>([])
  const [currentUser, setCurrentUser] = useState<UtilisateurDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setFilteredGroupes(
        groupes.filter(g =>
          g.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredGroupes(groupes)
    }
  }, [searchQuery, groupes])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const user = await authApi.me()
      setCurrentUser(user)

      const groupesData = await groupeApi.getAll()
      // Filtrer uniquement les groupes avec id
      const validGroupes = groupesData.filter(g => g.id)
      setGroupes(validGroupes)
      setFilteredGroupes(validGroupes)
    } catch (err: any) {
      setError(err.message || "Échec du chargement des groupes")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium">Chargement des groupes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Groupes de Travail</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Explorez et gérez les groupes et leurs projets collaboratifs.
          </p>
        </div>

        {/* Bouton Créer un groupe */}
        {currentUser?.validForProjectOperation && !currentUser?.guest && (
          <Link href="/dashboard/groups/new">
            <Button className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-5 w-5" />
              Créer un groupe
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4 flex-col md:flex-row items-center">
        <div className="w-full md:flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <Button variant="outline" className="h-12 rounded-xl px-5 gap-2">
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredGroupes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-20 bg-secondary/10 rounded-3xl border-2 border-dashed border-border/50"
            >
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold text-muted-foreground">Aucun groupe trouvé</p>
              <p className="text-muted-foreground mt-2">Essayez de modifier vos critères de recherche.</p>
            </motion.div>
          ) : (
            filteredGroupes.map((groupe, index) => {
              const isMember = groupe.membres?.some(m => m.id === currentUser?.id)

              return (
                <FadeIn key={groupe.id} delay={index * 0.05} direction="up">
                  <Card className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-border/50 overflow-hidden h-full flex flex-col rounded-3xl">
                    <div className={`h-2 w-full ${groupe.type === 'PUBLIC' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-secondary/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                          <Users className="h-6 w-6" />
                        </div>
                        <Badge variant={groupe.type === "PUBLIC" ? "secondary" : "outline"} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                          {groupe.type === "PUBLIC" ? (
                            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Public</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Privé</span>
                          )}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{groupe.nom}</CardTitle>
                      <CardDescription className="mt-3 line-clamp-2 text-sm leading-relaxed">{groupe.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end pt-0">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Membres</span>
                              <span className="font-bold text-sm">{groupe.nombreMembres || groupe.membres?.length || 0}</span>
                            </div>
                            <div className="w-px h-8 bg-border/50"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Créé le</span>
                              <span className="font-bold text-sm">{new Date(groupe.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                          {isMember && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] uppercase">Membre</Badge>
                          )}
                        </div>

                        {/* Lien vers les projets */}
                        {groupe.id && (
                          <Link href={`/dashboard/groups/${groupe.id}`} className="block">
                            <Button className="w-full rounded-2xl h-12 font-bold group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                              Voir les projets
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
