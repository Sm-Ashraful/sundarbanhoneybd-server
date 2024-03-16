import sharp from "sharp"; // Assuming Node.js and sharp library

// Function to convert DNG to WEBP
async function convertDngToWebp(inputPath, outputPath, degrees=90) {
  try {
    await sharp(inputPath)
      // Resize with cover fitting
      .rotate(degrees)
      .webp({ quality: 100 }) // Adjust quality as needed
      .toFile(outputPath);
    console.log(`Conversion successful! Output file saved at: ${outputPath}`);
  } catch (error) {
    console.error(`Error during conversion: ${error.message}`);
  }
}

// Example usage:
const inputDngPath = './haveCOnvert/IMG_2463.webp';
const outputWebpPath = './haveCOnvert/IMG_2063.webp';
convertDngToWebp(inputDngPath, outputWebpPath); // Use default resize dimensions (815x815)