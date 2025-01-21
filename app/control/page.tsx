"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const screens = [
  { id: "pid1", name: "PID 1" },
  { id: "pid2", name: "PID 2" },
  { id: "pid3", name: "PID 3" },
  { id: "pid4", name: "PID 4" },
  { id: "outbound", name: "Outbound Dock" },
  { id: "dockclerk", name: "Dock Clerk" },
]

export default function ControlPage() {
  const [isSharing, setIsSharing] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null)
  const [isSelectingScreen, setIsSelectingScreen] = useState(false)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({})

  useEffect(() => {
    screens.forEach((screen) => {
      peerConnections.current[screen.id] = new RTCPeerConnection()
    })

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close())
    }
  }, [])

  const startSharing = async () => {
    setIsSelectingScreen(true)
  }

  const confirmSharing = async () => {
    if (!selectedScreen) {
      alert("Please select a screen to share")
      return
    }

    try {
      let stream: MediaStream

      if (screenshot) {
        // Create a stream from the screenshot
        const img = new Image()
        img.src = URL.createObjectURL(screenshot)
        await new Promise((resolve) => (img.onload = resolve))
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext("2d")?.drawImage(img, 0, 0)
        stream = canvas.captureStream()
      } else {
        // Get the display media stream
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsSharing(true)
      setIsSelectingScreen(false)

      const peerConnection = peerConnections.current[selectedScreen]
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Here you would send the offer to the specific viewer page
      console.log("Offer for", selectedScreen, ":", offer)
    } catch (error) {
      console.error("Error starting screen share:", error)
      setIsSelectingScreen(false)
    }
  }

  const stopSharing = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setIsSharing(false)
    setSelectedScreen(null)
    setScreenshot(null)
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setScreenshot(file)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Screen Sharing Control</h1>
      <div className="space-y-6 w-full max-w-md">
        <div className="flex space-x-4">
          <Button onClick={startSharing} disabled={isSharing} className="flex-1">
            Start Sharing
          </Button>
          <Button onClick={stopSharing} disabled={!isSharing} variant="destructive" className="flex-1">
            Stop Sharing
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="screenshot-upload">Upload Screenshot</Label>
          <Input
            id="screenshot-upload"
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            disabled={isSharing}
          />
        </div>
      </div>
      <div className="mt-6 w-full max-w-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full border border-gray-300 rounded-lg" />
      </div>
      {isSharing && selectedScreen && (
        <p className="mt-4 text-green-600 font-semibold">
          Currently sharing to: {screens.find((s) => s.id === selectedScreen)?.name}
          {screenshot ? " (Screenshot)" : ""}
        </p>
      )}

      <Dialog open={isSelectingScreen} onOpenChange={setIsSelectingScreen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Screen to Share To</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={(value) => setSelectedScreen(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a screen" />
              </SelectTrigger>
              <SelectContent>
                {screens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={confirmSharing} disabled={!selectedScreen} className="w-full">
              Confirm and Start Sharing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

