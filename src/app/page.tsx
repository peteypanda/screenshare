import ControlUI from "@/components/ControlUI"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TV Control System</h1>
      <ControlUI />
    </main>
  )
}