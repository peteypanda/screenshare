import { Button } from "@/components/ui/button"

interface ScreenshareControlsProps {
  isScreensharing: boolean
  onStartScreenshare: () => void
  onStopScreenshare: () => void
  isSupported: boolean
}

export default function ScreenshareControls({
  isScreensharing,
  onStartScreenshare,
  onStopScreenshare,
  isSupported
}: ScreenshareControlsProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Screenshare Controls</h2>
      <div className="flex space-x-2">
        <Button onClick={onStartScreenshare} disabled={isScreensharing || !isSupported}>
          Start Screenshare
        </Button>
        <Button onClick={onStopScreenshare} disabled={!isScreensharing}>
          Stop Screenshare
        </Button>
      </div>
    </div>
  )
}