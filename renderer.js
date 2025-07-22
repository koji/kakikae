// Application state
let selectedFiles = [];
let outputDirectory = null;

// DOM elements
const dropArea = document.getElementById("dropArea");
const selectFilesBtn = document.getElementById("selectFilesBtn");
const clearBtn = document.getElementById("clearBtn");
const selectOutputBtn = document.getElementById("selectOutputBtn");
const convertBtn = document.getElementById("convertBtn");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const status = document.getElementById("status");

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateUI();
});

function setupEventListeners() {
  // File selection
  selectFilesBtn.addEventListener("click", selectFiles);
  clearBtn.addEventListener("click", clearFiles);
  selectOutputBtn.addEventListener("click", selectOutputDirectory);
  convertBtn.addEventListener("click", convertFiles);

  // Drag and drop
  dropArea.addEventListener("click", selectFiles);
  dropArea.addEventListener("dragover", handleDragOver);
  dropArea.addEventListener("dragleave", handleDragLeave);
  dropArea.addEventListener("drop", handleDrop);

  // Prevent default drag behaviors on the whole document
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());

  // Listen for conversion progress
  window.electronAPI.onConversionProgress((data) => {
    updateProgress(data);
  });
}

async function selectFiles() {
  try {
    const files = await window.electronAPI.selectFiles();
    if (files.length > 0) {
      selectedFiles.push(...files);
      updateUI();
      showDropSuccess();
    }
  } catch (error) {
    console.error("Error selecting files:", error);
    updateStatus("Error selecting files");
  }
}

function clearFiles() {
  selectedFiles = [];
  updateUI();
}

async function selectOutputDirectory() {
  try {
    const directory = await window.electronAPI.selectOutputDirectory();
    if (directory) {
      outputDirectory = directory;
      updateUI();
    }
  } catch (error) {
    console.error("Error selecting output directory:", error);
    updateStatus("Error selecting output directory");
  }
}

async function convertFiles() {
  if (!outputDirectory) {
    alert("Please select an output directory.");
    return;
  }

  if (selectedFiles.length === 0) {
    alert("Please select files to convert.");
    return;
  }

  try {
    // Disable convert button and show progress
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";
    convertBtn.classList.add("converting");
    progressContainer.style.display = "block";
    progressFill.style.width = "0%";

    updateStatus("Starting conversion...");

    const results = await window.electronAPI.convertFiles(
      selectedFiles,
      outputDirectory
    );

    // Process results
    const successful = results.filter((r) => r.success).length;
    const total = results.length;

    if (successful === total) {
      updateStatus(`Successfully converted ${successful} files`);
      alert(`Successfully converted ${successful} files!`);
    } else {
      updateStatus(`Converted ${successful}/${total} files`);
      alert(
        `Converted ${successful} out of ${total} files. Some files may have failed.`
      );
    }
  } catch (error) {
    console.error("Conversion error:", error);
    updateStatus("Conversion failed");
    alert(`Conversion failed: ${error.message}`);
  } finally {
    // Re-enable convert button
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert";
    convertBtn.classList.remove("converting");
    progressContainer.style.display = "none";
  }
}

function handleDragOver(e) {
  e.preventDefault();
  dropArea.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.preventDefault();
  dropArea.classList.remove("drag-over");
}

async function handleDrop(e) {
  e.preventDefault();
  dropArea.classList.remove("drag-over");

  const files = Array.from(e.dataTransfer.files);
  const filePaths = files.map((file) => file.path);

  try {
    const validFiles = await window.electronAPI.validateFiles(filePaths);

    if (validFiles.length > 0) {
      selectedFiles.push(...validFiles);
      updateUI();
      showDropSuccess();
    } else {
      alert(
        "No supported files found. Please drop PDF, DOCX, XLSX, PPTX, TXT, HTML, CSV, JSON, or XML files."
      );
    }
  } catch (error) {
    console.error("Error processing dropped files:", error);
    updateStatus("Error processing dropped files");
  }
}

function showDropSuccess() {
  dropArea.classList.add("drop-success");
  setTimeout(() => {
    dropArea.classList.remove("drop-success");
  }, 1000);
}

function updateProgress(data) {
  const percentage = (data.completed / data.total) * 100;
  progressFill.style.width = `${percentage}%`;
  updateStatus(
    `Converting ${data.current}... (${data.completed}/${data.total})`
  );
}

function updateUI() {
  // Update status
  if (selectedFiles.length > 0) {
    updateStatus(`${selectedFiles.length} files selected`);
  } else {
    updateStatus("Ready");
  }

  // Update output directory button text
  if (outputDirectory) {
    const shortPath =
      outputDirectory.length > 30
        ? "..." + outputDirectory.slice(-27)
        : outputDirectory;
    selectOutputBtn.textContent = `Output: ${shortPath}`;
  } else {
    selectOutputBtn.textContent = "Select Output Directory";
  }

  // Enable/disable convert button
  convertBtn.disabled = selectedFiles.length === 0 || !outputDirectory;
}

function updateStatus(message) {
  status.textContent = message;
}

// Cleanup on window unload
window.addEventListener("beforeunload", () => {
  window.electronAPI.removeAllListeners("conversion-progress");
});
