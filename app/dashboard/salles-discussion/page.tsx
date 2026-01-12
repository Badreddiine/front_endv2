"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { salleDiscussionApi, authApi, apiCall } from "@/lib/api-client"
import { SalleDiscussionDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Lock } from "lucide-react"

export default function SallesDiscussionPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<SalleDiscussionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        if (filter === 'all') {
          const data = await salleDiscussionApi.getById()
          // API might return array or { data: [...] }
          const list = Array.isArray(data) ? data : data?.data || []
          setRooms(list)
        } else {
          const user = await authApi.me()
          if (!user?.id) {
            setRooms([])
          } else {
            const data = await salleDiscussionApi.getByUser(user.id)
            const list = Array.isArray(data) ? data : data?.data || []
            setRooms(list)
          }
        }
      } catch (err: any) {
        console.error(err)
        setError("Erreur lors du chargement des salles de discussion")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [filter])

  const createGeneral = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiCall("/salles-discussion/generale", {
        method: "POST",
      })
      const id = res?.id
      router.push(id ? `/dashboard/salles-discussion/${id}` : `/dashboard/salles-discussion`)
    } catch (err: any) {
      console.error(err)
      setError("Erreur lors de la création de la salle générale")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Chargement...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Salles de discussion</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card p-1 rounded-lg">
            <button className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setFilter('all')}>Toutes</button>
            <button className={`px-3 py-1 rounded ${filter === 'mine' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setFilter('mine')}>Mes salles</button>
          </div>

          <Button onClick={createGeneral}>Créer une salle générale</Button>

          <Button asChild>
            <Link href="/dashboard/salles-discussion/new">Nouvelle salle</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{room.nom}</CardTitle>
                    {room.chiffree && <Lock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <CardDescription>{room.description}</CardDescription>
                </div>
                <Badge variant={room.type === "PROJET" ? "secondary" : "default"}>{room.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>{room.dernierMessage || "Aucun message"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{room.nombreMembres || (room.membres?.length ?? 0)} participant(s)</span>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/dashboard/salles-discussion/${room.id}`}>Entrer</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card className="text-center p-12">
          <p className="text-gray-500 mb-4">Aucune salle de discussion trouvée</p>
          <Button asChild>
            <Link href="/dashboard/salles-discussion/new">Créer votre première salle</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
