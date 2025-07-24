"use client"

import { useState, useEffect } from "react"
import { getAllRugs, type Rug } from "@/lib/rug-storage"
import { downloadAllAsZip } from "@/lib/download-utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import RugToolbar from "./RugToolbar"
import RugGrid from "./RugGrid"
import RugDetail from "../rug-detail"

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
    }

    setFilteredRugs(filtered)
  }

  const refreshRugs = () => {
    const all = getAllRugs()
    setRugs(all)
  }

  const handleDownloadAll = () => {
    downloadAllAsZip(filteredRugs)
  }

  if (selectedRug) {
    return (
      <RugDetail
        rug={selectedRug}
        onBack={() => setSelectedRug(null)}
        onUpdate={refreshRugs}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-bold text-gray-900">View Rugs</h3>
          </div>

          {filteredRugs.length > 0 && (
            <Button onClick={handleDownloadAll} variant="outline">
              Download All
            </Button>
          )}
        </div>

        <RugToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        <RugGrid rugs={filteredRugs} onSelectRug={setSelectedRug} />
      </div>
    </div>
  )
}
