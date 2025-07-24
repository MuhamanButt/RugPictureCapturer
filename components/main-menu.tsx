"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Grid3X3 } from "lucide-react"
import { useState } from "react"
import AddRugFlow from './AddRugFlow/AddRugFlow'
import ViewRugs from "./ViewRugs/view-rugs"

interface MainMenuProps {
  onBack: () => void
}

export default function MainMenu({ onBack }: MainMenuProps) {
  const [currentView, setCurrentView] = useState<"menu" | "add" | "view">("menu")

  if (currentView === "add") {
    return <AddRugFlow onBack={() => setCurrentView("menu")} />
  }

  if (currentView === "view") {
    return <ViewRugs onBack={() => setCurrentView("menu")} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 me-2">Main Menu</h1>
          v1.0.2
        </div>

        <div className="space-y-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView("add")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-3 text-green-600" />
                Add New Rug
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm">Create a new rug entry with photos</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView("view")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Grid3X3 className="w-5 h-5 mr-3 text-blue-600" />
                View Rugs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm">Browse and manage existing rugs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
