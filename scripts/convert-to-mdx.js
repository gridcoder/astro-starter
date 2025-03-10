import { exec } from 'child_process';
import { promises as fs, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  pagesDir: './src/pages',        // Root directory for pages
  docxFilename: 'word.docx',      // Name of input files
  mdxFilename: 'content.mdx'      // Name of output files
};

async function convertFile(dirPath) {
  try {
    const inputPath = join(dirPath, config.docxFilename);
    const outputPath = join(dirPath, config.mdxFilename);

    // Check if word.docx exists in this directory
    if (!existsSync(inputPath)) {
      return; // Skip directories without word.docx
    }

    const command = `pandoc --from=docx --to=gfm --output="${outputPath}" "${inputPath}"`;
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve({ stdout, stderr });
      });
    });
    
    if (stderr) {
      console.error(`Warning for ${dirPath}: ${stderr}`);
    }
    
    console.log(`✓ Converted ${relative(config.pagesDir, inputPath)} to MDX`);
  } catch (error) {
    console.error(`Error converting in ${dirPath}: ${error.message}`);
  }
}

async function findDirectoriesWithDocx(dir) {
  const directories = [];
  
  // Read all items in the directory
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recursively check subdirectories
      const subDirs = await findDirectoriesWithDocx(fullPath);
      directories.push(...subDirs);
      
      // Also check the current directory
      if (existsSync(join(fullPath, config.docxFilename))) {
        directories.push(fullPath);
      }
    }
  }
  
  return directories;
}

async function convertAll() {
  try {
    // Find all directories containing word.docx
    const directories = await findDirectoriesWithDocx(config.pagesDir);
    
    if (directories.length === 0) {
      console.log('No word.docx files found in pages directory structure');
      return;
    }
    
    console.log(`Found ${directories.length} word.docx files to convert:`);
    directories.forEach(dir => {
      console.log(`- ${relative(config.pagesDir, dir)}/word.docx`);
    });
    console.log('');
    
    // Convert all files
    const conversions = directories.map(dir => convertFile(dir));
    await Promise.all(conversions);
    
    console.log('\nConversion complete! 🎉');
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

// Run the conversion
convertAll();