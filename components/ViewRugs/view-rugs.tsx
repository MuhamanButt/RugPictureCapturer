"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, FolderOpen, ImageIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { getAllRugs, type Rug } from "@/lib/rug-storage"
import RugDetail from "../rug-detail"
import { downloadAsZip, downloadAllAsZip } from "@/lib/download-utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ViewRugsProps {
  onBack: () => void
}

export default function ViewRugs({ onBack }: ViewRugsProps) {
  const [rugs, setRugs] = useState<Rug[]>([])
  const [filteredRugs, setFilteredRugs] = useState<Rug[]>([])
  const [selectedRug, setSelectedRug] = useState<Rug | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState("recent")

  useEffect(() => {
    const all = getAllRugs()
    setRugs(all)
    setFilteredRugs(all)
  }, [])

  useEffect(() => {
    filterAndSortRugs()
  }, [searchQuery, sortOption, rugs])

  const filterAndSortRugs = () => {
    let filtered = rugs.filter((rug) =>
      rug.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    switch (sortOption) {
      case "id-asc":
        filtered.sort((a, b) => a.id.localeCompare(b.id))
        break
      case "id-desc":
        filtered.sort((a, b) => b.id.localeCompare(a.id))
        break
      case "photos":
        filtered.sort((a, b) => b.images.length - a.images.length)
        break
      default:
        // fallback to latest order (assuming rugs are saved with most recent first)
        break
    }

    setFilteredRugs(filtered)
  }

  const refreshRugs = () => {
    const all = getAllRugs()
    setRugs(all)
  }

  if (selectedRug) {
    return (
      <RugDetail rug={selectedRug} onBack={() => setSelectedRug(null)} onUpdate={refreshRugs} />
    )
  }

  const handleDownloadAll = () => {
    downloadAllAsZip(filteredRugs)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">View Rugs</h1>
          </div>

          {filteredRugs.length > 0 && (
            <Button onClick={handleDownloadAll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <Input
            placeholder="Search by Rug ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/2"
          />

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="id-asc">ID A → Z</SelectItem>
              <SelectItem value="id-desc">ID Z → A</SelectItem>
              <SelectItem value="photos">Most Photos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* No Rugs */}
        {filteredRugs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rugs found</h3>
              <p className="text-gray-600">Try a different search or add a rug</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
            {filteredRugs.map((rug) => (
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
