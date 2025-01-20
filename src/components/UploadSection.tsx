import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UploadSectionProps {
  onUpload: (file: File) => void
}

export default function UploadSection({ onUpload }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      onUpload(file)
      setFile(null)
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Upload Screenshot</h2>
      <div className="flex space-x-2">
        <Input type="file" onChange={handleFileChange} accept="image/*" />
        <Button onClick={handleUpload} disabled={!file}>
          Upload
        </Button>
      </div>
    </div>
  )
}