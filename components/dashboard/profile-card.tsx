 
"use client"

import type { User } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { User as UserIcon, Mail, Shield, AtSign, Edit3 } from "lucide-react"

export default function ProfileCard({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-lg">
      <div className="h-24 bg-gradient-to-r from-primary/80 to-accent/80"></div>
      <CardHeader className="relative pb-0">
        <div className="absolute -top-12 left-6">
          <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center text-primary font-bold text-3xl overflow-hidden">
            {user.displayName?.charAt(0) || user.fullName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="pt-12 flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{user.fullName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-medium">
                <Shield className="w-3 h-3 mr-1" /> {user.role}
              </Badge>
            </div>
          </div>
          <Link href="/dashboard/profile">
            <Button size="sm" variant="outline" className="rounded-full h-8 px-3">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Modifier
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <AtSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Identifiant</p>
              <p className="font-medium">@{user.identifiant}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-bold">12</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Projets</p>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center flex-1">
            <p className="text-xl font-bold">48</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tâches</p>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center flex-1">
            <p className="text-xl font-bold">92%</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Score</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
