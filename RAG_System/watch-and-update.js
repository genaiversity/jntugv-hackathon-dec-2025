// #!/usr/bin/env node

// const fs = require("fs");
// const path = require("path");
// const { spawn } = require("child_process");
// const chokidar = require("chokidar");

// // Paths
// const jobsJsonPath = path.join(__dirname, "../data/jobs.json");
// const gapAnalysisDir = __dirname;
// const frontendPublicDir = path.join(__dirname, "../Frontend/public");

// let isRunning = false;

// console.log("[WATCH] Starting watch for jobs.json changes...");
// console.log(`[WATCH] Watching: ${jobsJsonPath}`);
// console.log(`[WATCH] Will generate: ${gapAnalysisDir}/gap_analysis_*.json`);
// console.log(`[WATCH] Will copy to: ${frontendPublicDir}/`);
// console.log("");

// // Watch for jobs.json changes
// const watcher = chokidar.watch(jobsJsonPath, {
//   persistent: true,
//   awaitWriteFinish: {
//     stabilityThreshold: 2000,
//     pollInterval: 100,
//   },
// });

// function runPythonScript() {
//   if (isRunning) {
//     console.log("⏳ Previous run still in progress, skipping...");
//     return;
//   }

//   isRunning = true;
//   const timestamp = new Date().toLocaleTimeString();
//   console.log(
//     `\n[${timestamp}] 📝 Detected jobs.json change! Running gap analysis...`
//   );

//   // Run main.py with UTF-8 encoding for Windows compatibility
//   const python = spawn("python", ["main.py"], {
//     cwd: __dirname,
//     stdio: "pipe",
//     env: { ...process.env, PYTHONIOENCODING: "utf-8" },
//   });

//   let pythonOutput = "";
//   let pythonError = "";

//   python.stdout.on("data", (data) => {
//     pythonOutput += data.toString();
//     process.stdout.write(data);
//   });

//   python.stderr.on("data", (data) => {
//     pythonError += data.toString();
//     process.stderr.write(data);
//   });

//   python.on("close", (code) => {
//     if (code === 0) {
//       console.log(`\n✅ Gap analysis generated successfully!\n`);
//       copyGapAnalysisFiles();
//     } else {
//       console.error(`\n❌ Python script failed with code ${code}\n`);
//       if (pythonError) {
//         console.error("Error details:", pythonError);
//       }
//     }
//     isRunning = false;
//   });
// }

// function copyGapAnalysisFiles() {
//   try {
//     // Ensure frontend public directory exists
//     if (!fs.existsSync(frontendPublicDir)) {
//       fs.mkdirSync(frontendPublicDir, { recursive: true });
//       console.log(`📁 Created directory: ${frontendPublicDir}`);
//     }

//     // Find all gap_analysis_*.json files
//     const files = fs
//       .readdirSync(gapAnalysisDir)
//       .filter((file) => file.match(/^gap_analysis_\d+\.json$/));

//     if (files.length === 0) {
//       console.warn("⚠️  No gap_analysis files found!");
//       return;
//     }

//     console.log(`\n📋 Found ${files.length} gap analysis file(s):`);

//     files.forEach((file) => {
//       const srcPath = path.join(gapAnalysisDir, file);
//       const destPath = path.join(frontendPublicDir, file);

//       fs.copyFileSync(srcPath, destPath);
//       console.log(`  ✓ Copied: ${file}`);
//     });

//     console.log(
//       `\n🎉 Frontend updated! Changes visible immediately in browser.\n`
//     );
//   } catch (error) {
//     console.error("❌ Error copying files:", error.message);
//   }
// }

// // Watcher events
// watcher.on("change", (filePath) => {
//   console.log(`\n📂 File changed: ${path.basename(filePath)}`);
//   runPythonScript();
// });

// watcher.on("error", (error) => {
//   console.error("❌ Watcher error:", error);
// });

// // Initial message
// console.log(
//   "✨ Watch mode active. Updates to jobs.json will trigger gap analysis regeneration.\n"
// );

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const chokidar = require("chokidar");

// Paths
const jobsJsonPath = path.join(__dirname, "../data/jobs.json");
const gapAnalysisDir = __dirname;
const frontendPublicDir = path.join(__dirname, "../Frontend/public");

let isRunning = false;

console.log("[WATCH] Starting watch for jobs.json changes...");
console.log(`[WATCH] Watching: ${jobsJsonPath}`);
console.log(`[WATCH] Will generate: ${gapAnalysisDir}/gap_analysis_*.json`);
console.log(`[WATCH] Will copy to: ${frontendPublicDir}/`);
console.log("");

// Watch for jobs.json changes
const watcher = chokidar.watch(jobsJsonPath, {
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100,
  },
});

function runPythonScript() {
  if (isRunning) {
    console.log("⏳ Previous run still in progress, skipping...");
    return;
  }

  isRunning = true;
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `\n[${timestamp}] 📝 Detected jobs.json change! Running gap analysis...`
  );

  // Run main.py with UTF-8 encoding for Windows compatibility
  const python = spawn("python", ["main.py"], {
    cwd: __dirname,
    stdio: "pipe",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });

  let pythonOutput = "";
  let pythonError = "";

  python.stdout.on("data", (data) => {
    pythonOutput += data.toString();
    process.stdout.write(data);
  });

  python.stderr.on("data", (data) => {
    pythonError += data.toString();
    process.stderr.write(data);
  });

  python.on("close", (code) => {
    if (code === 0) {
      console.log(`\n✅ Gap analysis generated successfully!\n`);
      copyNewestGapAnalysisFile();
    } else {
      console.error(`\n❌ Python script failed with code ${code}\n`);
      if (pythonError) {
        console.error("Error details:", pythonError);
      }
    }
    isRunning = false;
  });
}

function copyNewestGapAnalysisFile() {
  try {
    // Ensure frontend public directory exists
    if (!fs.existsSync(frontendPublicDir)) {
      fs.mkdirSync(frontendPublicDir, { recursive: true });
      console.log(`📁 Created directory: ${frontendPublicDir}`);
    }

    // Find all gap_analysis_*.json files
    const files = fs
      .readdirSync(gapAnalysisDir)
      .filter((file) => file.match(/^gap_analysis_.*\.json$/))
      .map((file) => ({
        name: file,
        path: path.join(gapAnalysisDir, file),
        mtime: fs.statSync(path.join(gapAnalysisDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by newest first

    if (files.length === 0) {
      console.warn("⚠️  No gap_analysis files found!");
      return;
    }

    console.log(`📋 Found ${files.length} gap analysis file(s)`);

    // Get the newest file
    const newestFile = files[0];
    console.log(`✓ Newest file: ${newestFile.name}`);

    // Copy the newest file with a consistent name
    const destPath = path.join(frontendPublicDir, "gap_analysis_result.json");
    fs.copyFileSync(newestFile.path, destPath);
    console.log(`✓ Copied to: Frontend/public/gap_analysis_result.json`);

    // Clean up old files (keep only the newest one)
    if (files.length > 1) {
      console.log(`\n🧹 Cleaning up ${files.length - 1} old file(s)...`);
      for (let i = 1; i < files.length; i++) {
        try {
          fs.unlinkSync(files[i].path);
          console.log(`  ✓ Deleted: ${files[i].name}`);
        } catch (err) {
          console.error(`  ❌ Failed to delete ${files[i].name}:`, err.message);
        }
      }
    }

    // Also clean up old files in frontend/public
    const frontendFiles = fs
      .readdirSync(frontendPublicDir)
      .filter((file) => file.match(/^gap_analysis_\d+\.json$/));

    if (frontendFiles.length > 0) {
      console.log(`\n🧹 Cleaning up old frontend files...`);
      frontendFiles.forEach((file) => {
        try {
          fs.unlinkSync(path.join(frontendPublicDir, file));
          console.log(`  ✓ Deleted: ${file}`);
        } catch (err) {
          console.error(`  ❌ Failed to delete ${file}:`, err.message);
        }
      });
    }

    console.log(
      `\n🎉 Frontend updated! Changes visible immediately in browser.\n`
    );
  } catch (error) {
    console.error("❌ Error copying files:", error.message);
  }
}

// Watcher events
watcher.on("change", (filePath) => {
  console.log(`\n📂 File changed: ${path.basename(filePath)}`);
  runPythonScript();
});

watcher.on("error", (error) => {
  console.error("❌ Watcher error:", error);
});

// Initial message
console.log(
  "✨ Watch mode active. Updates to jobs.json will trigger gap analysis regeneration.\n"
);
console.log("💡 Press Ctrl+C to stop watching\n");
