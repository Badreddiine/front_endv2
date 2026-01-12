"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { projetApi, type ProjetCreateDTO } from "@/lib/api-client"
import { groupeApi, type GroupeDTO } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

export default function NewProjectPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Champs projet
  const [nomCourt, setNomCourt] = useState("")
  const [nomLong, setNomLong] = useState("")
  const [description, setDescription] = useState("")
  const [theme, setTheme] = useState("")
  const [typeProjet, setTypeProjet] = useState("")
  const [license, setLicense] = useState("")
  const [estPublic, setEstPublic] = useState(true)
  const [groupeId, setGroupeId] = useState("")

  const [groupes, setGroupes] = useState<GroupeDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirection si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  // Récupération des groupes
  useEffect(() => {
    const fetchGroupes = async () => {
      try {
        const data = await groupeApi.getAll()
        setGroupes(data || [])
      } catch (err) {
        console.error("Erreur récupération groupes :", err)
      }
    }
    fetchGroupes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nomCourt.trim()) {
      setError("Le nom court est obligatoire")
      return
    }

    if (!groupeId) {
      setError("Veuillez sélectionner un groupe")
      return
    }

    if (!user) {
      setError("Utilisateur non authentifié")
      return
    }

    try {
      setLoading(true)

      const payload: ProjetCreateDTO = {
        nomCourt,
        nomLong,
        description,
        theme,
        type: typeProjet,
        license,
        estPublic,
        groupeId,
        creatorId: user.id,
      }

      await projetApi.create(payload)
      router.push("/dashboard/projects") // retour à la liste des projets
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du projet")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <p>Loading...</p>

  // Groupe sélectionné
  const selectedGroupe = groupes.find((g) => g.id === groupeId)

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau projet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Nom court *</label>
              <Input
                value={nomCourt}
                onChange={(e) => setNomCourt(e.target.value)}
                placeholder="Ex : GEST-PROJ"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nom long</label>
              <Input
                value={nomLong}
                onChange={(e) => setNomLong(e.target.value)}
                placeholder="Gestion des projets de recherche"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description détaillée du projet"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thème</label>
              <Input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Informatique, IA, Réseaux..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                value={typeProjet}
                onChange={(e) => setTypeProjet(e.target.value)}
                placeholder="Recherche, Application, Étude..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Licence</label>
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="MIT, Apache, GPL..."
              />
            </div>

            {/* Sélection du groupe */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Groupe *</label>
              <select
                value={groupeId}
                onChange={(e) => setGroupeId(e.target.value)}
                className="w-full h-11 rounded-xl border border-border/50 bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10"
                required
              >
                <option value="">Sélectionner un groupe</option>
                {groupes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom} ({g.nomCourt})
                  </option>
                ))}
              </select>
            </div>

            {/* Carte groupe sélectionné */}
            {selectedGroupe && (
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent>
                  <p className="font-semibold">{selectedGroupe.nomCourt}</p>
                  <p className="text-sm text-gray-600">{selectedGroupe.nom}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={estPublic} onCheckedChange={setEstPublic} />
              <span className="text-sm font-medium">Projet public</span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}