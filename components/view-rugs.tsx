"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, FolderOpen, ImageIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { getAllRugs, type Rug } from "@/lib/rug-storage"
import RugDetail from "./rug-detail"
import { downloadAsZip, downloadAllAsZip } from "@/lib/download-utils"

interface ViewRugsProps {
  onBack: () => void
}

export default function ViewRugs({ onBack }: ViewRugsProps) {
  const [rugs, setRugs] = useState<Rug[]>([])
  const [selectedRug, setSelectedRug] = useState<Rug | null>(null)

  useEffect(() => {
    setRugs(getAllRugs())
  }, [])

  const refreshRugs = () => {
    setRugs(getAllRugs())
  }

  if (selectedRug) {
    return <RugDetail rug={selectedRug} onBack={() => setSelectedRug(null)} onUpdate={refreshRugs} />
  }

  const handleDownloadAll = () => {
    downloadAllAsZip(rugs)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">View Rugs</h1>
          </div>

          {rugs.length > 0 && (
            <Button onClick={handleDownloadAll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          )}
        </div>

        {rugs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rugs yet</h3>
              <p className="text-gray-600">Add your first rug to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rugs.map((rug) => (
              <Card
                key={rug.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedRug(rug)}
              >
                <CardContent className="p-4">
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
