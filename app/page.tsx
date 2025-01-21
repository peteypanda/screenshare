import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Multi-Screen Sharing App</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/control">
          <Button className="w-full">Control Page</Button>
        </Link>
        <Link href="/viewer/pid1">
          <Button variant="outline" className="w-full">
            PID 1 Viewer
          </Button>
        </Link>
        <Link href="/viewer/pid2">
          <Button variant="outline" className="w-full">
            PID 2 Viewer
          </Button>
        </Link>
        <Link href="/viewer/pid3">
          <Button variant="outline" className="w-full">
            PID 3 Viewer
          </Button>
        </Link>
        <Link href="/viewer/pid4">
          <Button variant="outline" className="w-full">
            PID 4 Viewer
          </Button>
        </Link>
        <Link href="/viewer/outbound">
          <Button variant="outline" className="w-full">
            Outbound Dock Viewer
          </Button>
        </Link>
        <Link href="/viewer/dockclerk">
          <Button variant="outline" className="w-full">
            Dock Clerk Viewer
          </Button>
        </Link>
      </div>
    </div>
  )
}

