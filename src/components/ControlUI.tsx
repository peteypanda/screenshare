"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/hooks/useSocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Peer from 'simple-peer'

export default function ControlUI() {
  const [selectedTVs, setSelectedTVs] = useState<string[]>([])
  const [isScreensharing, setIsScreensharing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const socket = useSocket()
  const [isClient, setIsClient] = useState(false)
  const [screenShareSupported, setScreenShareSupported] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const peerRef = useRef<Peer.Instance | null>(null)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      setScreenShareSupported(
        !!navigator.mediaDevices &&
        !!navigator.mediaDevices.getDisplayMedia
      )
    }

    if (socket) {
      socket.on('signal', (data) => {
        if (peerRef.current) {
          peerRef.current.signal(data)
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('signal')
      }
    }
  }, [socket])

  const handleStartScreenshare = async () => {
    if (screenShareSupported) {
      try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setStream(mediaStream)
        setIsScreensharing(true)

        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: mediaStream,
        })

        peer.on('signal', (data) => {
          socket?.emit('signal', { signal: data, tvs: selectedTVs })
        })

        peer.on('connect', () => {
          console.log('Peer connection established')
        })

        peerRef.current = peer

        console.log("Screen sharing started")
      } catch (err) {
        console.error("Error accessing screen:", err)
        alert("Failed to start screen sharing. Please make sure you've granted the necessary permissions.")
      }
    } else {
      console.error("Screen sharing is not supported in this environment")
      alert("Screen sharing is not supported in your current environment. Please ensure you're using a compatible browser and the application is running in a secure context (HTTPS or localhost).")
    }
  }

  const handleStopScreenshare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    setStream(null)
    setIsScreensharing(false)
    socket?.emit("stop-screenshare", { tvs: selectedTVs })
  }

  const handleUploadScreenshot = async () => {
    if (!file) {
      alert("Please select a file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("tvs", JSON.stringify(selectedTVs))

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      console.log("Screenshot uploaded successfully")
      socket?.emit("content-update", { type: "image", url: data.fileUrl, tvs: selectedTVs })
      setFile(null)
    } else {
      console.error("Failed to upload screenshot")
      alert("Failed to upload screenshot. Please try again.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const toggleTV = (tv: string) => {
    setSelectedTVs(prevTVs => 
      prevTVs.includes(tv) 
        ? prevTVs.filter(t => t !== tv) 
        : [...prevTVs, tv]
    )
  }

  if (!isClient) {
    return null // or a loading indicator
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-4">TV Control System</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select TVs</h2>
        <div className="flex space-x-2">
          {["TV1", "TV2", "TV3", "TV4"].map((tv) => (
            <Button 
              key={tv} 
              onClick={() => toggleTV(tv)}
              variant={selectedTVs.includes(tv) ? "default" : "outline"}
            >
              {tv}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Screenshare Controls</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={handleStartScreenshare} 
            disabled={isScreensharing || !screenShareSupported}
          >
            Start Screenshare
          </Button>
          <Button 
            onClick={handleStopScreenshare} 
            disabled={!isScreensharing}
          >
            Stop Screenshare
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Upload Screenshot</h2>
        <div className="flex space-x-2">
          <Input type="file" onChange={handleFileChange} accept="image/*" />
          <Button onClick={handleUploadScreenshot} disabled={!file}>
            Upload
          </Button>
        </div>
      </div>

      {!screenShareSupported && (
        <p className="text-red-500">
          Screen sharing is not supported in your current environment. 
          Please ensure you're using a compatible browser and the application is running in a secure context (HTTPS or localhost).
        </p>
      )}
    </div>
  )
}