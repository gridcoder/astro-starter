import { execSync, spawnSync } from 'child_process';
import readline from 'readline';

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
  return branches.includes(branchName);
}

// Add backup functionality for the pull branch
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

// Improve copy files with better error handling
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
    
    // Copy each changed file
    for (const { file } of changedFiles) {
      if (file) {
        console.log(`Copying: ${file}`);
        try {
          execSync(`git checkout ${pullBranchName} -- "${file}"`, { stdio: 'pipe' });
        } catch (error) {
          console.error(`Error copying ${file}: ${error.message}`);
        }
      }
    }
    
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

function pushToUpstream(branchName) {
  return new Promise((resolve) => {
    rl.question(`\nDo you want to push to upstream/main? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Pushing to upstream/main...');
        
        // Use spawnSync for better error handling
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
        console.log('Skipping push to upstream.');
        resolve(false);
      }
    });
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
    // Identify pull branch name
    let pullBranchName = 'pull-from-upstream';
    if (!checkIfBranchExists(pullBranchName)) {
      const branches = executeCommand('git branch');
      const pullBranches = branches.split('\n')
        .filter(b => b.trim().startsWith('pull-from-upstream'));
      
      if (pullBranches.length === 0) {
        console.error('Error: No pull-from-upstream branch found. Please run the pull-from-upstream script first.');
        process.exit(1);
      } else if (pullBranches.length === 1) {
        pullBranchName = pullBranches[0].trim().replace('* ', '');
      } else {
        console.log('Multiple pull-from-upstream branches found:');
        pullBranches.forEach((b, i) => {
          console.log(`${i + 1}: ${b.trim().replace('* ', '')}`);
        });
        
        await new Promise((resolve) => {
          rl.question('Please enter the number of the branch to use: ', (answer) => {
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < pullBranches.length) {
              pullBranchName = pullBranches[index].trim().replace('* ', '');
              console.log(`Using branch: ${pullBranchName}`);
              resolve();
            } else {
              console.error('Invalid selection. Exiting.');
              process.exit(1);
            }
          });
        });
      }
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