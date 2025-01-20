"use client"

import { useState, useEffect } from "react"
import { useSocket } from "@/hooks/useSocket"

export default function ViewerUI() {
  const [content, setContent] = useState<string | null>(null)
  const socket = useSocket()

  useEffect(() => {
    if (socket) {
      console.log("Socket connected in ViewerUI")

      socket.on("start-screenshare", (data) => {
        console.log("Received start-screenshare signal", data)
        setContent("screenshare")
      })

      socket.on("stop-screenshare", () => {
        console.log("Received stop-screenshare signal")
        setContent(null)
      })

      socket.on("content-update", (data) => {
        console.log("Received content update", data)
        if (data.type === "image") {
          setContent(data.url)
        }
      })

      return () => {
        socket.off("start-screenshare")
        socket.off("stop-screenshare")
        socket.off("content-update")
      }
    }
  }, [socket])

  console.log("Current content state:", content)

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      {content === "screenshare" ? (
        <div className="text-white text-2xl">Screen sharing active</div>
      ) : content ? (
        <img src={content} alt="Uploaded content" className="w-full h-full object-contain" />
      ) : (
        <div className="text-white text-2xl">Waiting for content...</div>
      )}
    </div>
  )
}