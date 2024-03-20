import sharp from "sharp"; // Assuming Node.js and sharp library

// Function to convert DNG to WEBP
async function convertDngToWebp(
  inputPath,
  outputPath,
  resizeWidth = 2048,
  resizeHeight = 2048
) {
  try {
    await sharp(inputPath)
      .resize({ width: resizeWidth, height: resizeHeight, fit: "cover" }) // Resize with cover fitting
      .webp({ quality: 100 }) // Adjust quality as needed
      .toFile(outputPath);
    console.log(`Conversion successful! Output file saved at: ${outputPath}`);
  } catch (error) {
    console.error(`Error during conversion: ${error.message}`);
  }
}

// Example usage:
const inputDngPath = "./toConvert/IMG_2327.jpeg";
const outputWebpPath = "./haveCOnvert/IMG_2327.webp";
convertDngToWebp(inputDngPath, outputWebpPath); // Use default resize dimensions (815x815)
