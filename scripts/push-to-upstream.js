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

// Improved copy files with better error handling
function copyChangedFiles(pullBranchName) {
  console.log('\nCopying all changed files from your project...');
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
    
    let errorCount = 0;
    let successCount = 0;
    
    // Copy each changed file
    for (const { file, status } of changedFiles) {
      if (!file) continue;
      
      try {
        console.log(`Copying: ${file}`);
        
        // Check if the file exists in the source branch before copying
        const fileExists = spawnSync('git', ['ls-tree', '-r', pullBranchName, '--', file], {
          encoding: 'utf8'
        }).stdout.trim() !== '';
        
        if (fileExists) {
          execSync(`git checkout ${pullBranchName} -- "${file}"`, { stdio: 'pipe' });
          successCount++;
        } else if (status === 'D') {
          // If file was deleted, remove it from the working tree
          console.log(`File was deleted in ${pullBranchName}, marking for deletion`);
          try {
            execSync(`git rm "${file}"`, { stdio: 'pipe' });
            successCount++;
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
    
    console.log(`\nCopied ${successCount} files successfully. ${errorCount} files had errors.`);
    
    // Display summary of changes
    console.log('\nSummary of copied files:');
    console.log('New files:');
    try {
      const newFiles = execSync('git diff --name-status --cached | grep "^A" || echo "None"', { encoding: 'utf8' });
      console.log(newFiles);
    } catch (error) {
      console.log('None');
    }
    
    console.log('\nModified files:');
    try {
      const modFiles = execSync('git diff --name-status --cached | grep "^M" || echo "None"', { encoding: 'utf8' });
      console.log(modFiles);
    } catch (error) {
      console.log('None');
    }
    
    console.log('\nDeleted files:');
    try {
      const delFiles = execSync('git diff --name-status --cached | grep "^D" || echo "None"', { encoding: 'utf8' });
      console.log(delFiles);
    } catch (error) {
      console.log('None');
    }
    
    console.log('\nAll changes have been copied. Please review them in VS Code.');
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
        console.log('Great! Proceeding to next step.');
        resolve(true);
      } else {
        console.log('Please commit your changes in VS Code before continuing.');
        rl.question('Press Enter when you have committed your changes...', () => {
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
      const suggestedBranchName = `feature-${repoName}-${timestamp}`;
      
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
    
    // Copy changed files
    copyChangedFiles(pullBranchName);
    
    // Review changes in terminal
    printDiffStats();
    
    // Wait for manual review in VS Code
    await waitForReview();
    
    // Commit changes
    await commitChanges();
    
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