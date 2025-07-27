'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, Clock, Send, Loader2 } from 'lucide-react'

interface ParkingResponse {
  canPark: boolean
  message: string
  timeRestrictions?: string
}

export default function CanIParkHere() {
  const [signText, setSignText] = useState('')
  const [datetime, setDatetime] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ParkingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // In a real app, you'd use OCR here
      setSignText(`[Photo uploaded: ${file.name}]`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signText.trim()) {
      setError('Please enter sign text or upload a photo')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/parking-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signText: signText.trim(),
          datetime: datetime || new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check parking rules')
      }

      const data: ParkingResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewCheck = () => {
    setSignText('')
    setDatetime('')
    setSelectedFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            🅿️ CanIParkHere
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload a parking sign or enter text to check parking rules
          </p>
        </div>

        {/* Input Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Check Parking Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📸 Upload Sign Photo
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ {selectedFile.name} uploaded
                  </p>
                )}
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ✍️ Or Enter Sign Text Manually
                </label>
                <Textarea
                  placeholder="e.g., 'No parking 8am-6pm Monday-Friday'"
                  value={signText}
                  onChange={(e) => setSignText(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🕒 When? (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 'Tuesday 4:30pm' or leave blank for now"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !signText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Check Parking Rules
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {(result || error) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Result</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-400">❌ {error}</p>
                </div>
              )}
              
              {result && (
                <div className="space-y-4">
                  <div className={`border rounded-lg p-4 ${
                    result.canPark 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <p className={`font-semibold ${
                      result.canPark 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {result.canPark ? '✅' : '❌'} {result.message}
                    </p>
                    {result.timeRestrictions && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {result.timeRestrictions}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleNewCheck}
                    variant="outline"
                    className="w-full"
                  >
                    Check Another Sign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}