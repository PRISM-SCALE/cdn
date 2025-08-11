// compress-images-recursive.js
import { exec } from "child_process"
import fs from "fs"
import path from "path"

const SRC_DIR = path.resolve("public/images")
const OUT_DIR = path.join(path.dirname(SRC_DIR), "images-compressed")

const supportedExt = [".jpg", ".jpeg", ".png", ".webp"]

// Create base output folder if it doesn't exist
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

console.log(`🚀 Recursively compressing from: ${SRC_DIR}`)
console.log(`📂 Output folder: ${OUT_DIR}`)

/**
 * Recursively gets all files with their source and destination paths
 */
function getAllFiles(srcFolder, outFolder) {
  const items = fs.readdirSync(srcFolder)
  let fileList = []

  for (const item of items) {
    const srcPath = path.join(srcFolder, item)
    const outPath = path.join(outFolder, item)
    const stats = fs.statSync(srcPath)

    if (stats.isDirectory()) {
      fileList = fileList.concat(getAllFiles(srcPath, outPath))
    } else {
      fileList.push({ srcPath, outPath })
    }
  }

  return fileList
}

/**
 * Sequentially process each file
 */
function processFilesSequentially(files, index = 0) {
  if (index >= files.length) {
    console.log("✅ All files processed!")
    return
  }

  const { srcPath, outPath } = files[index]
  const outFolder = path.dirname(outPath)

  // Ensure output subfolder exists
  if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder, { recursive: true })
  }

  if (supportedExt.includes(path.extname(srcPath).toLowerCase())) {
    console.log(`⚙️ Compressing: ${srcPath}`)
    const command = `squoosh-cli --webp '{"quality":80}' -d "${outFolder}" "${srcPath}"`
    exec(command, (error) => {
      if (error) {
        console.warn(`⚠️ Compression failed for ${srcPath}, copying original.`)
        fs.copyFileSync(srcPath, outPath)
      }
      processFilesSequentially(files, index + 1)
    })
  } else {
    console.log(`📄 Copying without compression: ${srcPath}`)
    fs.copyFileSync(srcPath, outPath)
    processFilesSequentially(files, index + 1)
  }
}

// Get complete list of files from the folder tree
const allFiles = getAllFiles(SRC_DIR, OUT_DIR)

// Start processing
processFilesSequentially(allFiles)
