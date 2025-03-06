const { execSync } = require('child_process');
const readline = require('readline');

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

function checkIfClean() {
  console.log('Checking if repository is clean...');
  const status = executeCommand('git status --porcelain');
  
  if (status.trim() !== '') {
    console.error('Error: Repository has uncommitted changes. Please commit or stash your changes first.');
    process.exit(1);
  }
  
  console.log('Repository is clean. Proceeding...');
}

function createBranch(branchName) {
  console.log('Checking if branch exists...');
  try {
    const branches = executeCommand('git branch');
    if (branches.includes(branchName)) {
      return promptForNewBranchName(branchName);
    } else {
      console.log(`Creating branch: ${branchName}`);
      executeCommand('git checkout dev');
      executeCommand(`git checkout -b ${branchName}`);
      return branchName;
    }
  } catch (error) {
    console.error('Error checking branches:', error.message);
    process.exit(1);
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
      try {
        const branches = executeCommand('git branch');
        if (!branches.includes(newBranchName)) break;
      } catch (error) {
        console.error('Error checking branches:', error.message);
        process.exit(1);
      }
    } while (true);
    
    rl.question(`Would you like to use '${newBranchName}' instead? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log(`Creating branch: ${newBranchName}`);
        executeCommand('git checkout dev');
        executeCommand(`git checkout -b ${newBranchName}`);
        resolve(newBranchName);
      } else {
        console.log('Please manually create a branch and try again.');
        rl.close();
        process.exit(0);
      }
    });
  });
}

function pullFromUpstream() {
  console.log('Pulling changes from upstream/main...');
  try {
    executeCommand('git pull upstream main');
    console.log('Successfully pulled changes from upstream.');
  } catch (error) {
    console.log('Merge conflicts detected. Please resolve conflicts in VS Code, then commit the changes.');
    console.log('After resolving conflicts, you can continue with the push-to-upstream script.');
    process.exit(1);
  }
}

function createBackup() {
  const backupBranchName = 'backup-dev';
  console.log(`Creating backup of dev branch as '${backupBranchName}'...`);
  
  try {
    const branches = executeCommand('git branch');
    if (branches.includes(backupBranchName)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newBackupName = `${backupBranchName}-${timestamp}`;
      executeCommand(`git branch ${newBackupName} dev`);
      console.log(`Created backup branch: ${newBackupName}`);
    } else {
      executeCommand(`git branch ${backupBranchName} dev`);
      console.log(`Created backup branch: ${backupBranchName}`);
    }
  } catch (error) {
    console.error('Error creating backup:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Step 1: Verify repo is clean
    checkIfClean();
    
    // Create backup of dev branch
    createBackup();
    
    // Step 2: Create temporary branch
    const branchName = await createBranch('pull-from-upstream');
    
    // Step 3: Pull from upstream
    pullFromUpstream();
    
    console.log('\nCompleted successfully!');
    console.log(`The branch '${branchName}' now contains the latest changes from upstream.`);
    console.log('You can now run the push-to-upstream script to selectively push your changes to upstream.');
    
    rl.close();
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    rl.close();
    process.exit(1);
  }
}

main();