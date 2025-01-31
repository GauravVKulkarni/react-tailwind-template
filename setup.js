import { readFile, writeFile, existsSync, renameSync, unlinkSync } from "fs";
import { basename, resolve, join } from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the new project name (only letters, numbers, hyphens, or underscores): ", (newName) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
    console.log("❌ Invalid project name. Use only letters, numbers, hyphens, or underscores.");
    rl.close();
    return;
  }

  const oldName = basename(process.cwd());
  const files = ["package.json", "vite.config.js", "README.md"];
  let allUpdatesSuccessful = true;
  let pendingTasks = files.length;

  console.log(`\n🔄 Updating project name from '${oldName}' to '${newName}'...`);

  files.forEach((file) => {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      readFile(filePath, "utf8", (err, content) => {
        if (err) {
          console.error(`❌ Error reading ${file}:`, err);
          allUpdatesSuccessful = false;
        } else {
          const updatedContent = content.replace(new RegExp(oldName, "g"), newName);
          writeFile(filePath, updatedContent, "utf8", (err) => {
            if (err) {
              console.error(`❌ Error writing ${file}:`, err);
              allUpdatesSuccessful = false;
            } else {
              console.log(`✅ Updated ${file}`);
            }
            checkAndClose();
          });
        }
      });
    } else {
      checkAndClose();
    }
  });

  // Rename project folder safely
  const parentDir = resolve(process.cwd(), "..");
  const newPath = join(parentDir, newName);

  if (existsSync(newPath)) {
    console.log("⚠️ A folder with the new name already exists. Skipping folder rename.");
    checkAndClose();
  } else {
    try {
      renameSync(process.cwd(), newPath);
      console.log(`✅ Project folder renamed to '${newName}'.`);
    } catch (err) {
      console.log("⚠️ Unable to rename the project folder. Please rename it manually.");
      allUpdatesSuccessful = false;
      checkAndClose();
    }
  }

  function checkAndClose() {
    pendingTasks--;
    if (pendingTasks === 0) {
      if (allUpdatesSuccessful) {
        console.log("\n🎉 Renaming complete! Run these commands next:\n");
        console.log(`cd ${newName}`);
        console.log("npm install");

        // Self-delete the script
        const scriptPath = join(newPath, "setup.js");
        try {
          unlinkSync(scriptPath);
          console.log("🗑️  Setup script deleted automatically.");
        } catch (err) {
          console.log("⚠️ Could not delete setup.js. Please remove it manually.");
        }
      } else {
        console.log("\n⚠️ Setup encountered some errors. Keeping setup.js for debugging.");
      }
      rl.close();
    }
  }
});