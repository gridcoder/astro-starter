import { execSync, spawnSync } from 'child_process';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkIfBranchExists(branchName) {
  const branches = executeCommand('git branch');
  return branches.split('\n').some(branch => 
    branch.trim().replace('* ', '') === branchName
  );
}

// Get the repository name from the local repository directory
function getRepositoryName() {
  try {
    // First try: Get from the directory name
    const repoPath = executeCommand('git rev-parse --show-toplevel').trim();
    const dirName = path.basename(repoPath);
    
    if (dirName && dirName !== '') {
      return dirName;
    }
    
    // Second try: Get from origin remote URL
    const originUrl = executeCommand('git config --get remote.origin.url').trim();
    if (originUrl) {
      const match = originUrl.match(/\/([^\/]+?)(\.git)?$/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Third try: Get from package.json if it exists
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      const packageJsonExists = executeCommand(`test -f "${packageJsonPath}" && echo "exists" || echo ""`).trim();
      
      if (packageJsonExists === 'exists') {
        const packageJson = JSON.parse(executeCommand(`cat "${packageJsonPath}"`));
        if (packageJson.name) {
          return packageJson.name.replace(/^@.*\//, ''); // Remove scope if present
        }
      }
    } catch (packageError) {
      // Silently fail if package.json doesn't exist or can't be parsed
    }
    
    // Fallback to a generic name with timestamp
    return `repo-${new Date().toISOString().slice(0, 10)}`;
  } catch (error) {
    console.log('Could not determine repository name, using generic name.');
    return `repo-${new Date().toISOString().slice(0, 10)}`;
  }
}

// Improved function to find all branches with a specific prefix
function findBranchesByPrefix(prefix) {
  const branchOutput = executeCommand('git branch');
  return branchOutput.split('\n')
    .map(b => b.trim().replace('* ', ''))
    .filter(b => b.startsWith(prefix) && b !== '');
}

// Add backup functionality for the pull branch with branch selection
function createBackup(branchName) {
  const backupBranchName = `backup-${branchName}`;
  console.log(`Creating backup of '${branchName}' branch as '${backupBranchName}'...`);
  
  try {
    const branches = executeCommand('git branch');
    if (branches.includes(backupBranchName)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newBackupName = `${backupBranchName}-${timestamp}`;
      executeCommand(`git branch ${newBackupName} ${branchName}`);
      console.log(`Created backup branch: ${newBackupName}`);
    } else {
      executeCommand(`git branch ${backupBranchName} ${branchName}`);
      console.log(`Created backup branch: ${backupBranchName}`);
    }
  } catch (error) {
    console.error('Error creating backup:', error.message);
    process.exit(1);
  }
}

function createUpstreamBranch(branchName) {
  if (checkIfBranchExists(branchName)) {
    return promptForNewBranchName(branchName);
  } else {
    console.log(`Creating branch: ${branchName} based on upstream/main`);
    executeCommand(`git checkout -b ${branchName} upstream/main`);
    return branchName;
  }
}

function promptForNewBranchName(existingBranch) {
  return new Promise((resolve) => {
    console.log(`Branch '${existingBranch}' already exists.`);
    
    // Generate a suggested branch name with a number
    let counter = 1;
    let newBranchName;
    
    do {
      newBranchName = `${existingBranch}-${counter}`;
      counter++;
      if (!checkIfBranchExists(newBranchName)) break;
    } while (true);
    
    rl.question(`Would you like to use '${newBranchName}' instead? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log(`Creating branch: ${newBranchName} based on upstream/main`);
        executeCommand(`git checkout -b ${newBranchName} upstream/main`);
        resolve(newBranchName);
      } else {
        console.log('Please manually create a branch and try again.');
        rl.close();
        process.exit(0);
      }
    });
  });
}

// Helper function to extract directory structure from files
function extractDirectoryStructure(files) {
  const directoryMap = new Map();
  
  files.forEach(file => {
    if (!file) return;
    
    // Get all parent directories
    const parts = file.split('/');
    let path = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
      path = path ? `${path}/${parts[i]}` : parts[i];
      
      if (!directoryMap.has(path)) {
        directoryMap.set(path, 0);
      }
      directoryMap.set(path, directoryMap.get(path) + 1);
    }
  });
  
  // Convert the map to an array of objects with path and count
  return Array.from(directoryMap.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

// Add a function to let the user filter files before copying
function filterChangedFiles(changedFiles) {
  return new Promise(async (resolve) => {
    console.log('\nDetected changes:');
    
    // Extract file information
    const fileTypes = [...new Set(changedFiles.map(f => {
      const ext = path.extname(f.file || '');
      return ext ? ext.substring(1) : 'other';
    }))].sort();
    
    const allFiles = changedFiles.map(f => f.file).filter(Boolean);
    const directories = extractDirectoryStructure(allFiles);
    
    // Group files by status
    const newFiles = changedFiles.filter(f => f.status === 'A').map(f => f.file);
    const modifiedFiles = changedFiles.filter(f => f.status === 'M').map(f => f.file);
    const deletedFiles = changedFiles.filter(f => f.status === 'D').map(f => f.file);
    
    console.log(`\nFile types: ${fileTypes.join(', ')}`);
    console.log(`\nDirectories with changes:`);
    directories.forEach((dir, index) => console.log(`${index + 1}. ${dir.path}/ (${dir.count} files)`));
    
    console.log(`\nNew files: ${newFiles.length}`);
    console.log(`Modified files: ${modifiedFiles.length}`);
    console.log(`Deleted files: ${deletedFiles.length}`);
    
    // Start a recursive function for filtering menu interaction
    async function showFilteringMenu() {
      const filterOptions = await new Promise(res => {
        rl.question('\nDo you want to select which files to copy? (y/n): ', answer => {
          // If empty response, treat as "no"
          if (!answer.trim()) {
            console.log('Continuing with all files...');
            return res(false);
          }
          res(answer.toLowerCase() === 'y');
        });
      });
      
      if (!filterOptions) {
        return changedFiles;
      }
      
      console.log('\nSelect files by directory:');
      console.log('Syntax examples:');
      console.log('- "1,3,5": Include directories 1, 3, and 5');
      console.log('- "1-5": Include directories 1 through 5');
      console.log('- "!2": Exclude directory 2');
      console.log('- "1-10,!3,!5-7": Include directories 1-10 except 3 and 5-7');
      console.log('- Enter nothing to include all directories');
      console.log('Note: Selecting a directory does NOT automatically select its subdirectories');
      
      const filterInput = await new Promise(res => {
        rl.question('\nEnter filter pattern: ', answer => {
          res(answer.trim());
        });
      });
      
      // Empty input means all files
      if (!filterInput) {
        console.log('Continuing with all files...');
        return changedFiles;
      }
      
      try {
        // Parse the filter pattern into include and exclude sets
        const { includeIndices, excludeIndices } = parseFilterPattern(filterInput, directories.length);
        
        // Build a set of directory paths to include/exclude
        const includeDirs = new Set();
        const excludeDirs = new Set();
        
        includeIndices.forEach(idx => {
          includeDirs.add(directories[idx].path);
        });
        
        excludeIndices.forEach(idx => {
          excludeDirs.add(directories[idx].path);
        });
        
        // Filter files based on the directory sets
        const filteredFiles = changedFiles.filter(f => {
          if (!f.file) return false;
          
          // Get the directory path for this file
          const fileParts = f.file.split('/');
          const fileName = fileParts[fileParts.length - 1];
          
          // Handle files at the root level (no directory)
          if (fileParts.length === 1) {
            // If we're including the root directory, keep the file
            return includeIndices.length === 0 || includeDirs.has('');
          }
          
          // Get the exact directory path for this file (not parent directories)
          const exactDirPath = fileParts.slice(0, -1).join('/');
          
          // If this exact directory path is excluded, filter out the file
          if (excludeDirs.has(exactDirPath)) {
            return false;
          }
          
          // If this exact directory path is included, keep the file
          if (includeDirs.has(exactDirPath)) {
            return true;
          }
          
          // If we have includes but none matched, exclude the file
          return includeIndices.length === 0;
        });
        
        console.log(`\nSelected ${filteredFiles.length} out of ${changedFiles.length} files.`);
        
        const includeList = [...includeDirs].map(dir => `"${dir}"`).join(', ');
        const excludeList = [...excludeDirs].map(dir => `"${dir}"`).join(', ');
        
        if (includeDirs.size > 0) {
          console.log(`Including directories: ${includeList || 'all'}`);
        }
        if (excludeDirs.size > 0) {
          console.log(`Excluding directories: ${excludeList}`);
        }
        
        return await continueFilteringPrompt(filteredFiles);
      } catch (error) {
        console.error(`Error parsing filter pattern: ${error.message}`);
        return showFilteringMenu();
      }
    }
    
    // Helper function to parse the filter pattern
    function parseFilterPattern(pattern, dirCount) {
      const includeIndices = new Set();
      const excludeIndices = new Set();
      
      // Split by commas
      const parts = pattern.split(',').map(p => p.trim()).filter(p => p);
      
      for (const part of parts) {
        const isExclude = part.startsWith('!');
        const numberPart = isExclude ? part.substring(1) : part;
        
        // Check if it's a range (e.g., "1-5")
        if (numberPart.includes('-')) {
          const [start, end] = numberPart.split('-').map(n => parseInt(n.trim(), 10));
          
          if (isNaN(start) || isNaN(end)) {
            throw new Error(`Invalid range format: ${numberPart}`);
          }
          
          if (start < 1 || end > dirCount || start > end) {
            throw new Error(`Range out of bounds: ${numberPart}. Valid range: 1-${dirCount}`);
          }
          
          // Add all indices in the range
          for (let i = start; i <= end; i++) {
            if (isExclude) {
              excludeIndices.add(i - 1);  // Convert to 0-based index
            } else {
              includeIndices.add(i - 1);  // Convert to 0-based index
            }
          }
        } else {
          // It's a single number
          const index = parseInt(numberPart, 10);
          
          if (isNaN(index)) {
            throw new Error(`Invalid number format: ${numberPart}`);
          }
          
          if (index < 1 || index > dirCount) {
            throw new Error(`Index out of bounds: ${index}. Valid range: 1-${dirCount}`);
          }
          
          if (isExclude) {
            excludeIndices.add(index - 1);  // Convert to 0-based index
          } else {
            includeIndices.add(index - 1);  // Convert to 0-based index
          }
        }
      }
      
      return { includeIndices: [...includeIndices], excludeIndices: [...excludeIndices] };
    }
    
    // Helper function to ask if user wants to continue filtering
    async function continueFilteringPrompt(currentFiltered) {
      if (currentFiltered.length === 0) {
        console.log('No files match your filter criteria.');
        const tryAgain = await new Promise(res => {
          rl.question('Would you like to try different filters? (y/n): ', answer => {
            res(answer.toLowerCase() === 'y');
          });
        });
        
        if (tryAgain) {
          return showFilteringMenu();
        }
        return currentFiltered;
      }
      
      const continueFiltering = await new Promise(res => {
        rl.question('Do you want to apply additional filters? (y/n): ', answer => {
          res(answer.toLowerCase() === 'y');
        });
      });
      
      if (continueFiltering) {
        return showFilteringMenu(currentFiltered);
      }
      return currentFiltered;
    }
    
    // Start the filtering menu and resolve with the resulting filtered files
    const result = await showFilteringMenu();
    resolve(result);
  });
}

// Improved copy files with better error handling and removed staging step
async function copyChangedFiles(pullBranchName) {
  console.log('\nDetecting changed files from your project...');
  try {
    // Use spawnSync for better output handling
    const gitProcess = spawnSync('git', ['diff', '--name-status', 'upstream/main', pullBranchName], {
      encoding: 'utf8'
    });
    
    if (gitProcess.status !== 0) {
      console.error('Error getting changed files:', gitProcess.stderr);
      process.exit(1);
    }
    
    const changedFiles = gitProcess.stdout.trim().split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [status, file] = line.split('\t');
        return { status, file };
      });
    
    if (changedFiles.length === 0) {
      console.log('No changes detected between upstream/main and your branch.');
      return;
    }
    
    // Allow user to filter files
    const filesToCopy = await filterChangedFiles(changedFiles);
    
    if (filesToCopy.length === 0) {
      console.log('No files selected for copying. Exiting.');
      process.exit(0);
    }
    
    let errorCount = 0;
    let successCount = 0;
    
    // Copy each changed file
    for (const { file, status } of filesToCopy) {
      if (!file) continue;
      
      try {
        console.log(`Processing: ${file}`);
        
        // Check if the file exists in the source branch before copying
        const fileExists = spawnSync('git', ['ls-tree', '-r', pullBranchName, '--', file], {
          encoding: 'utf8'
        }).stdout.trim() !== '';
        
        if (fileExists) {
          execSync(`git checkout ${pullBranchName} -- "${file}"`, { stdio: 'pipe' });
          successCount++;
        } else if (status === 'D') {
          // If file was deleted, remove it from the working tree
          console.log(`File was deleted in ${pullBranchName}, removing ${file}`);
          try {
            if (spawnSync('test', ['-e', file], { stdio: 'ignore' }).status === 0) {
              execSync(`rm "${file}"`, { stdio: 'pipe' });
              successCount++;
            } else {
              console.log(`Note: File ${file} was already removed`);
            }
          } catch (rmError) {
            console.log(`Note: File ${file} was already removed`);
          }
        } else {
          console.log(`Warning: File ${file} not found in ${pullBranchName}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\nProcessed ${successCount} files successfully. ${errorCount} files had errors.`);
    
    // Display summary of changes - removed staging step
    const changedCount = executeCommand('git diff --name-only | wc -l').trim();
    
    console.log('\nSummary:');
    console.log(`- ${changedCount} files have been modified`);
    
    console.log('\nAll changes have been applied. Please review them in VS Code.');
  } catch (error) {
    console.error('Error copying files:', error.message);
    process.exit(1);
  }
}

// The rest of the functions remain similar but with improved error handling
function waitForReview() {
  return new Promise((resolve) => {
    rl.question('\nOnce you have reviewed the changes in VS Code, press Enter to continue...', () => {
      resolve();
    });
  });
}

function commitChanges() {
  return new Promise((resolve) => {
    rl.question('\nHave you committed your changes in VS Code? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Great! Changes committed.');
        resolve(true);
      } else {
        console.log('Please commit your changes in VS Code before continuing.');
        rl.question('Press Enter when you have committed your changes...', () => {
          console.log('Continuing with workflow...');
          resolve(true);
        });
      }
    });
  });
}

// Updated to allow pushing to a feature branch instead of main
function pushToUpstream(branchName) {
  return new Promise(async (resolve) => {
    console.log('\nYou have two options for pushing:');
    console.log('1. Push to a new feature branch in upstream (safer)');
    console.log('2. Push directly to upstream/main (use with caution)');
    
    const answer = await new Promise(res => {
      rl.question('Enter your choice (1 or 2): ', res);
    });
    
    if (answer === '1') {
      // Push to feature branch
      const repoName = getRepositoryName();
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const suggestedBranchName = `${repoName}-downstream-updates-${timestamp}`;
      
      const customBranchName = await new Promise(res => {
        rl.question(`Enter feature branch name [${suggestedBranchName}]: `, (input) => {
          res(input.trim() || suggestedBranchName);
        });
      });
      
      console.log(`Pushing to upstream/${customBranchName}...`);
      
      // Use spawnSync for better error handling
      const gitProcess = spawnSync('git', ['push', 'upstream', `${branchName}:${customBranchName}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      if (gitProcess.status === 0) {
        console.log(`Successfully pushed to upstream/${customBranchName}!`);
        console.log(`You can now create a pull request from ${customBranchName} to main in the upstream repository.`);
        resolve(true);
      } else {
        console.error('Error pushing to upstream:');
        console.error(gitProcess.stderr);
        console.log('You may need to create a pull request manually.');
        resolve(false);
      }
    } else if (answer === '2') {
      // Push directly to main (original behavior)
      console.log('Pushing directly to upstream/main...');
      
      const confirmation = await new Promise(res => {
        rl.question('Are you sure you want to push directly to main? (y/n): ', res);
      });
      
      if (confirmation.toLowerCase() !== 'y') {
        console.log('Push cancelled.');
        resolve(false);
        return;
      }
      
      const gitProcess = spawnSync('git', ['push', 'upstream', `${branchName}:main`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      if (gitProcess.status === 0) {
        console.log('Successfully pushed to upstream/main!');
        resolve(true);
      } else {
        console.error('Error pushing to upstream:');
        console.error(gitProcess.stderr);
        console.log('You may need to create a pull request instead if the repository has branch protection.');
        resolve(false);
      }
    } else {
      console.log('Invalid choice. Skipping push.');
      resolve(false);
    }
  });
}

function cleanupBranches(pullBranchName, pushBranchName) {
  return new Promise((resolve) => {
    rl.question('\nDo you want to clean up temporary branches? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Cleaning up branches...');
        
        // Return to dev branch
        executeCommand('git checkout dev');
        
        // Delete temporary branches
        if (checkIfBranchExists(pullBranchName)) {
          console.log(`Deleting branch: ${pullBranchName}`);
          executeCommand(`git branch -D ${pullBranchName}`);
        }
        
        if (checkIfBranchExists(pushBranchName)) {
          console.log(`Deleting branch: ${pushBranchName}`);
          executeCommand(`git branch -D ${pushBranchName}`);
        }
        
        console.log('Cleanup complete!');
      } else {
        console.log('Keeping temporary branches.');
      }
      resolve();
    });
  });
}

function printDiffStats() {
  console.log('\nReviewing staged changes:');
  try {
    const diffStat = executeCommand('git diff --staged --stat');
    console.log(diffStat || 'No changes staged.');
  } catch (error) {
    console.log('No changes to display.');
  }
}

async function main() {
  try {
    // Improved: Identify pull branch name with better handling of multiple branches
    const pullBranchPrefix = 'pull-from-upstream';
    const pullBranches = findBranchesByPrefix(pullBranchPrefix);
    
    let pullBranchName;
    
    if (pullBranches.length === 0) {
      console.error(`Error: No branches starting with "${pullBranchPrefix}" found.`);
      console.error('Please run the pull-from-upstream script first.');
      process.exit(1);
    } else if (pullBranches.length === 1) {
      pullBranchName = pullBranches[0];
      console.log(`Using branch: ${pullBranchName}`);
    } else {
      // Multiple branches found - prompt the user to choose
      console.log(`Multiple pull branches found:`);
      pullBranches.forEach((branch, i) => {
        console.log(`${i + 1}: ${branch}`);
      });
      
      const branchIndex = await new Promise((resolve) => {
        rl.question('Enter the number of the branch to use: ', (answer) => {
          const index = parseInt(answer) - 1;
          if (isNaN(index) || index < 0 || index >= pullBranches.length) {
            console.error('Invalid selection. Exiting.');
            process.exit(1);
          }
          resolve(index);
        });
      });
      
      pullBranchName = pullBranches[branchIndex];
      console.log(`Using branch: ${pullBranchName}`);
    }
    
    // Create backup of pull branch
    createBackup(pullBranchName);
    
    // Create upstream branch
    const pushBranchName = await createUpstreamBranch('push-to-upstream');
    
    // Implement iterative workflow for copying and committing changes
    let continueIterating = true;
    
    while (continueIterating) {
      // Copy changed files
      await copyChangedFiles(pullBranchName);
      
      // Skip the review step and go directly to commit
      // Review changes in terminal
      printDiffStats();
      
      // Commit changes
      const committed = await commitChanges();
      
      // Ask if user wants to continue with more files
      continueIterating = await new Promise(resolve => {
        rl.question('\nDo you want to copy more files? (y/n): ', answer => {
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!continueIterating) {
        console.log('\nMoving to push step...');
      }
    }
    
    // Push to upstream
    await pushToUpstream(pushBranchName);
    
    // Cleanup
    await cleanupBranches(pullBranchName, pushBranchName);
    
    console.log('\nProcess completed successfully!');
    rl.close();
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    rl.close();
    process.exit(1);
  }
}

main();