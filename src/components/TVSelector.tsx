import { Button } from "@/components/ui/button"

interface TVSelectorProps {
  selectedTVs: string[]
  setSelectedTVs: (tvs: string[]) => void
}

export default function TVSelector({ selectedTVs, setSelectedTVs }: TVSelectorProps) {
  const tvs = ["TV1", "TV2", "TV3", "TV4"]

  const toggleTV = (tv: string) => {
    setSelectedTVs(selectedTVs.includes(tv) ? selectedTVs.filter((t) => t !== tv) : [...selectedTVs, tv])
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Select TVs</h2>
      <div className="flex space-x-2">
        {tvs.map((tv) => (
          <Button key={tv} variant={selectedTVs.includes(tv) ? "default" : "outline"} onClick={() => toggleTV(tv)}>
            {tv}
          </Button>
        ))}
      </div>
    </div>
  )
}