import { Rug } from "@/lib/rug-storage"
import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"
import RugCard from "./RugCard"

interface RugGridProps {
  rugs: Rug[]
  onSelectRug: (rug: Rug) => void
}

export default function RugGrid({ rugs, onSelectRug }: RugGridProps) {
  if (rugs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rugs found</h3>
          <p className="text-gray-600">Try a different search or add a rug</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 gap-1">
      {rugs.map((rug) => (
        <RugCard key={rug.id} rug={rug} onClick={() => onSelectRug(rug)} />
      ))}
    </div>
  )
}
