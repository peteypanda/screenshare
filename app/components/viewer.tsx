"use client"

import { useRef, useEffect, useState } from "react"

interface ViewerProps {
  screenName: string
}

export default function Viewer({ screenName }: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection()

    peerConnection.current.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0]
      }
    }

    peerConnection.current.oniceconnectionstatechange = () => {
      setIsConnected(peerConnection.current?.iceConnectionState === "connected")
    }

    // Here you would set up a connection to receive offers for this specific screen

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Screen Share Viewer - {screenName}</h1>
      <div className="w-full max-w-4xl">
        <video ref={videoRef} autoPlay playsInline className="w-full border border-gray-300 rounded-lg" />
      </div>
      <p className="mt-4 text-lg">Status: {isConnected ? "Connected" : "Waiting for connection..."}</p>
    </div>
  )
}

