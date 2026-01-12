"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { projetApi, type ProjetDTO } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id
  const [project, setProject] = useState<ProjetDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const data = await projetApi.getById(projectId)
        setProject(data)
      } catch (err: any) {
        setError(err.message || "Impossible de charger le projet")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  if (loading) return <p>Chargement...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!project) return <p>Projet introuvable</p>

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{project.nomCourt} — {project.nomLong}</CardTitle>
        {project.description && (
          <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {project.statut && (
          <p><strong>Statut :</strong> {project.statut}</p>
        )}
        {project.tauxCompletion !== undefined && (
          <p><strong>Progression :</strong> {project.tauxCompletion}%</p>
        )}
        {project.nombreMembres !== undefined && (
          <p><strong>Membres :</strong> {project.nombreMembres}</p>
        )}
        {project.nombreTaches !== undefined && (
          <p><strong>Tâches :</strong> {project.nombreTaches}</p>
        )}
        {project.theme && (
          <p><strong>Thème :</strong> {project.theme}</p>
        )}
        {project.type && (
          <p><strong>Type :</strong> {project.type}</p>
        )}
        {project.license && (
          <p><strong>Licence :</strong> {project.license}</p>
        )}
        {project.estPublic !== undefined && (
          <p><strong>Projet public :</strong> {project.estPublic ? "Oui" : "Non"}</p>
        )}
      </CardContent>
    </Card>
  )
}