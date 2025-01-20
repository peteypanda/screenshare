import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const tvs = JSON.parse(formData.get("tvs") as string)

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = Date.now() + "-" + file.name
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  const filepath = path.join(uploadDir, filename)

  try {
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    await writeFile(filepath, buffer)
    const fileUrl = `/uploads/${filename}`
    console.log(`File saved to ${filepath}`)

    return NextResponse.json({ message: "File uploaded successfully", fileUrl })
  } catch (error) {
    console.error("Error saving file:", error)
    return NextResponse.json({ error: "Error saving file" }, { status: 500 })
  }
}