import { Rug } from "@/lib/rug-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, Download } from "lucide-react"
import { downloadAsZip } from "@/lib/download-utils"

interface RugCardProps {
  rug: Rug
  onClick: () => void
}

export default function RugCard({ rug, onClick }: RugCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-1">
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {rug.images.length > 0 ? (
            <img
              src={rug.images[0].secureUrl || "/placeholder.svg"}
              alt={rug.id}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-mono font-bold text-lg">{rug.id}</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{rug.images.length} photos</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                downloadAsZip(rug)
              }}
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
