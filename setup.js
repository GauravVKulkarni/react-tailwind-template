import { readFile, writeFile, existsSync, renameSync, unlinkSync } from "fs";
import { basename, resolve, join } from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function updateFilesAndRenameProject(newName) {
  const oldName = basename(process.cwd());
  const files = ["package.json", "vite.config.js", "README.md"];
  let allUpdatesSuccessful = true;

  // Updating project files
  for (const file of files) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      try {
        const content = await readFileAsync(filePath, "utf8");
        const updatedContent = content.replace(new RegExp(oldName, "g"), newName);
        await writeFileAsync(filePath, updatedContent, "utf8");
        console.log(`✅ Updated ${file}`);
      } catch (err) {
        console.error(`❌ Error reading or writing ${file}:`, err);
        allUpdatesSuccessful = false;
      }
    }
  }

  // Renaming the project folder
  const parentDir = resolve(process.cwd(), "..");
  const newPath = join(parentDir, newName);

  if (existsSync(newPath)) {
    console.log("⚠️ A folder with the new name already exists. Skipping folder rename.");
  } else {
    try {
      renameSync(process.cwd(), newPath);
      console.log(`✅ Project folder renamed to '${newName}'.`);
    } catch (err) {
      console.log("⚠️ Unable to rename the project folder. Please rename it manually.");
      allUpdatesSuccessful = false;
    }
  }

  if (allUpdatesSuccessful) {
    console.log("\n🎉 Renaming complete! Run these commands next:\n");
    console.log(`cd ${newName}`);
    console.log("npm install");

    // Self-delete the script after renaming
    const scriptPath = join(newPath, "setup.js");
    try {
      await unlinkAsync(scriptPath);
      console.log("🗑️  Setup script deleted automatically.");
    } catch (err) {
      console.log("⚠️ Could not delete setup.js. Please remove it manually.");
    }
  } else {
    console.log("\n⚠️ Setup encountered some errors. Keeping setup.js for debugging.");
  }

  rl.close();
}

function readFileAsync(filePath, encoding) {
  return new Promise((resolve, reject) => {
    readFile(filePath, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function writeFileAsync(filePath, data, encoding) {
  return new Promise((resolve, reject) => {
    writeFile(filePath, data, encoding, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function unlinkAsync(filePath) {
  return new Promise((resolve, reject) => {
    unlinkSync(filePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

rl.question("Enter the new project name (only letters, numbers, hyphens, or underscores): ", (newName) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
    console.log("❌ Invalid project name. Use only letters, numbers, hyphens, or underscores.");
    rl.close();
    return;
  }

  console.log(`\n🔄 Updating project name from '${basename(process.cwd())}' to '${newName}'...`);
  updateFilesAndRenameProject(newName);
});