"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera } from "lucide-react"
import { useState } from "react"
import { generateRugId, saveRug } from "@/lib/rug-storage"
import { COLORS, RUG_TYPES, SIZES } from "./functionality"
import CameraCapture from "../CameraCapture/CameraCapture"


export default function AddRugFlow({ onBack }) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [rugId, setRugId] = useState("")

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      const id = generateRugId(selectedType, selectedSize, selectedColor)
      setRugId(id)
      setShowCamera(true)
    }
  }

  const handleCameraComplete = (images) => {
    // Save the rug with images
    saveRug({
      id: rugId,
      type: selectedType,
      size: selectedSize,
      color: selectedColor,
      images: images,
      createdAt: new Date().toISOString(),
    })

    setStep(1)
    setSelectedType("")
    setSelectedSize("")
    setSelectedColor("")
    setShowCamera(false)
    setRugId("")
    onBack()
  }

  if (showCamera) {
    return <CameraCapture rugId={rugId} onComplete={handleCameraComplete} onBack={() => setShowCamera(false)} />
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedType !== ""
      case 2:
        return selectedSize !== ""
      case 3:
        return selectedColor !== ""
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Rug</h1>
        </div>
        {(selectedType || selectedSize || selectedColor) && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Preview ID:</h3>
              <div className="font-mono text-lg bg-gray-100 p-2 rounded">
                {selectedType}
                {selectedSize}
                {selectedColor}-?
              </div>
              <p className="text-xs text-gray-500 mt-1">The number will be auto-generated based on existing rugs</p>
            </CardContent>
          </Card>
        )}
        <div className="mb-6 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Select Rug Type"}
              {step === 2 && "Select Size"}
              {step === 3 && "Select Color"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {step === 1 &&
                RUG_TYPES.map((type) => (
                  <Button
                    key={type.code}
                    variant={selectedType === type.code ? "default" : "outline"}
                    className="h-16 text-left justify-start"
                    onClick={() => setSelectedType(type.code)}
                  >
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs opacity-70">{type.code}</div>
                    </div>
                  </Button>
                ))}

              {step === 2 &&
                SIZES.map((size) => (
                  <Button
                    key={size.code}
                    variant={selectedSize === size.code ? "default" : "outline"}
                    className="h-16 text-left justify-start"
                    onClick={() => setSelectedSize(size.code)}
                  >
                    <div>
                      <div className="font-medium">{size.label}</div>
                      <div className="text-xs opacity-70">{size.code}</div>
                    </div>
                  </Button>
                ))}

{step === 3 &&
  COLORS.map((color) => (
    <Button
      key={color.code}
      variant={selectedColor === color.code ? "default" : "outline"}
      style={{backgroundColor:color.hex,}}
      className={`h-16 text-left justify-start ${color.bg} ${color.text}`}
      onClick={() => setSelectedColor(color.code)}
    >
      <div>
        <div className="font-medium">{color.label}</div>
        <div className="text-xs opacity-70">{color.code}</div>
      </div>
    </Button>
  ))}

            </div>

            <div className="mt-6 flex justify-between gap-2">
              <Button variant="outline" style={{width:"100%"}} onClick={() => (step > 1 ? setStep(step - 1) : onBack())}>
                Back
              </Button>
              <Button onClick={handleNext} style={{width:"100%"}} disabled={!canProceed()} className="flex items-center">
                {step === 3 ? (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Add Photos
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </div>
  )
}
