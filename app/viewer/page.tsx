"use client"

import { useRef, useEffect, useState } from "react"

export default function ViewerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const [currentScreen, setCurrentScreen] = useState<string | null>(null)

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection()

    peerConnection.current.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0]
      }
    }

    // Here you would receive the offer and selected screen from the control page
    // For simplicity, we'll just log when the connection is established
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.current?.iceConnectionState)
    }

    // Simulating receiving the selected screen
    // In a real application, this would come from your signaling server
    setTimeout(() => {
      setCurrentScreen("All PIDs (1-4)")
    }, 2000)

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Screen Share Viewer</h1>
      {currentScreen && <p className="text-lg font-semibold mb-4">Currently viewing: {currentScreen}</p>}
      <div className="w-full max-w-4xl">
        <video ref={videoRef} autoPlay playsInline className="w-full border border-gray-300 rounded-lg" />
      </div>
    </div>
  )
}

