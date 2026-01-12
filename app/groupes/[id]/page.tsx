"use client"

import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { groupeApi } from "@/lib/api-client"
import { GroupeDTO } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function GroupeDetailPage() {
  const params = useParams()
  const groupeId = params.id

  const [groupe, setGroupe] = useState<GroupeDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroupe = async () => {
      if (!groupeId) {
        setError("ID du groupe manquant")
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await groupeApi.getById(groupeId)
        if (!data?.id) {
          setError("Groupe introuvable")
        } else {
          setGroupe(data)
        }
      } catch (err: any) {
        setError(err.message || "Impossible de charger le groupe")
      } finally {
        setLoading(false)
      }
    }
    fetchGroupe()
  }, [groupeId])

  if (loading) return <p>Chargement du groupe...</p>
  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
  if (!groupe) return <p>Groupe introuvable</p>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{groupe.nom}</h1>
      <p className="mb-2">{groupe.description}</p>
      <p className="text-sm text-muted-foreground">Membres : {groupe.membres?.length || 0}</p>
      <p className="text-sm text-muted-foreground">Créé le : {new Date(groupe.dateCreation).toLocaleDateString('fr-FR')}</p>
      {/* Ici tu peux ajouter la liste des projets du groupe */}
    </div>
  )
}
