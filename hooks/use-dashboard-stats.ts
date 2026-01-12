"use client"

import { useEffect, useState, useCallback } from "react"
import { projetApi, tacheApi, groupeApi } from "@/lib/api-client"

export default function useDashboardStats() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    totalGroups: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  })
  const [projectStats, setProjectStats] = useState<any[]>([])
  const [taskStats, setTaskStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true)
      const [projects, tasks, groups] = await Promise.all([projetApi.getAll(), tacheApi.getAll(), groupeApi.getAll()])

      const projectData = projects || []
      const taskData = tasks || []
      const groupData = groups || []

      setStats({
        totalProjects: projectData.length,
        totalTasks: taskData.length,
        totalGroups: groupData.length,
        completedTasks: taskData.filter((t: any) => t.etat === "TERMINE").length,
        inProgressTasks: taskData.filter((t: any) => t.etat === "EN_COURS").length,
      })

      const projectStatusCount = projectData.reduce((acc: any, p: any) => {
        acc[p.statut] = (acc[p.statut] || 0) + 1
        return acc
      }, {})

      setProjectStats(Object.entries(projectStatusCount).map(([status, count]: [string, any]) => ({ name: status, value: count })))

      const taskStatusCount = taskData.reduce((acc: any, t: any) => {
        acc[t.etat] = (acc[t.etat] || 0) + 1
        return acc
      }, {})

      setTaskStats(Object.entries(taskStatusCount).map(([status, count]: [string, any]) => ({ name: status === "A_FAIRE" ? "À faire" : status === "EN_COURS" ? "En cours" : "Terminé", value: count })))
    } catch (err) {
      console.error("Error fetching dashboard stats", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  // Listen for global refresh events so multiple hook instances can sync
  useEffect(() => {
    const handler = () => {
      try {
        fetch()
      } catch (err) {
        console.error("Error handling dashboard:refresh event", err)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("dashboard:refresh", handler)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard:refresh", handler)
      }
    }
  }, [fetch])

  return {
    stats,
    projectStats,
    taskStats,
    isLoading,
    refresh: fetch,
  }
}

// Utility to trigger a global dashboard refresh from anywhere in the app
export function triggerDashboardRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dashboard:refresh"))
  }
}
