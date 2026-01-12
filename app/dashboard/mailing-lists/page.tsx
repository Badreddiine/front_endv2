import { Suspense } from "react"
import MailingListsContent from "@/components/dashboard/mailing-lists-content"

export default function MailingListsPage() {
  return (
    <Suspense fallback={<MailingListsLoadingFallback />}>
      {/* @ts-expect-error Server Component/Client component boundary handled via Suspense */}
      <MailingListsContent />
    </Suspense>
  )
}

function MailingListsLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
        </div>
        <p className="text-muted-foreground font-medium">Loading mailing lists...</p>
      </div>
    </div>
  )
}
