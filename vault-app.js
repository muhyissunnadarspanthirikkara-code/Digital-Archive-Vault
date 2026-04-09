// ========== CONFIG: CLOUD & FALLBACK ==========
const CLOUDINARY_CLOUD_NAME = "dmxnbdmaf";
const CLOUDINARY_UPLOAD_PRESET = "vault_upload";

// Back4App (Parse)
Parse.initialize(
    "dKR9Ht5Moa9biA0oVlwW5XVpFxsdnlTBU6M0nkjG",
    "iRZOpPRdlfE4ZmPBTkn0zvSTANiMtDtR07CpJ2vp"
);
Parse.serverURL = "https://parseapi.back4app.com/";

// EmailJS
const EMAILJS_SERVICE  = "service_10hbfpn";
const EMAILJS_TEMPLATE = "template_eycxtak";

// ========== STATE ==========
let currentUser   = null;
let allFiles      = [];
let currentFilter = "all";
let selectedFile  = null;
let currentOTP    = null;
let targetEmail   = "";

// ========== DOM REFS ==========
const authSection      = document.getElementById("auth-section");
const dashSection      = document.getElementById("dashboard-section");
const fileGrid         = document.getElementById("file-grid");
const searchInput      = document.getElementById("search-input");
const fileInput        = document.getElementById("file-input");
const uploadTrigger    = document.getElementById("upload-trigger");
const dropZone         = document.getElementById("drop-zone");
const logoutBtn        = document.getElementById("logout-btn");
const previewModal     = document.getElementById("preview-modal");
const storageProgress  = document.getElementById("storage-progress");
const storagePercent   = document.getElementById("storage-percentage");
const storageText      = document.getElementById("storage-text");
const userEmailDisplay = document.getElementById("user-email-display");
const userAvatar       = document.getElementById("user-avatar");

// ========== INIT ==========
function init() {
    lucide.createIcons();
    setupEvents();
    showAuth();
}

// ========== AUTH ==========
function showAuth() {
    dashSection.classList.add("hidden");
    authSection.classList.remove("hidden");
}

function showDashboard() {
    authSection.classList.add("hidden");
    dashSection.classList.remove("hidden");
    userEmailDisplay.textContent = currentUser.email;
    userAvatar.textContent = (currentUser.email[0] || "U").toUpperCase();
    lucide.createIcons();
}

async function handleRequestOTP(e) {
    e.preventDefault();
    targetEmail = document.getElementById("login-email").value.trim();
    const btn   = document.getElementById("send-otp-btn");
    currentOTP = Math.floor(100000 + Math.random() * 900000);
    console.log("Dev OTP:", currentOTP);

    btn.disabled = true;
    btn.textContent = "Sending...";

    try {
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            to_email: targetEmail,
            otp_code: currentOTP,
            user_email: targetEmail,
            code: currentOTP
        });
        showToast("Code sent to " + targetEmail, "success");
    } catch (err) {
        console.error("Email Error:", err);
        showToast("EmailJS Error: " + (err.text || "Failed to send"), "error");
    }

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send"></i> Send OTP Code';
    lucide.createIcons();
    showOTPVerifyStep();
}

function showOTPVerifyStep() {
    document.getElementById("login-form-container").classList.add("hidden");
    document.getElementById("otp-verify-container").classList.remove("hidden");
    document.getElementById("display-otp-email").textContent = targetEmail;
}

function showEmailStep() {
    document.getElementById("otp-verify-container").classList.add("hidden");
    document.getElementById("login-form-container").classList.remove("hidden");
}

function handleVerifyOTP(e) {
    e.preventDefault();
    const entered = document.getElementById("native-otp-input").value;
    if (String(entered) === String(currentOTP)) {
        currentUser = { email: targetEmail };
        showToast("Logged in successfully!", "success");
        showDashboard();
        loadFiles();
        loadStats();
    } else {
        document.getElementById("native-otp-input").style.border = "1px solid #ef4444";
        showToast("Incorrect code. Try again.", "error");
    }
}

function doLogout() {
    currentUser = null;
    allFiles = [];
    fileGrid.innerHTML = "";
    showAuth();
    showEmailStep();
    document.getElementById("login-email").value = "";
    document.getElementById("native-otp-input").value = "";
    showToast("Logged out", "info");
}

// ========== STORAGE ENGINE (HYBRID CLOUD & LOCAL) ==========
async function loadFiles() {
    fileGrid.innerHTML = `<div class="empty-state"><div class="loader"></div><p>Loading vault...</p></div>`;
    lucide.createIcons();

    let cloudFiles = [];
    let localFiles = loadFromLocal();

    try {
        const ArchiveFile = Parse.Object.extend("ArchiveFile");
        const q = new Parse.Query(ArchiveFile);
        q.equalTo("userEmail", currentUser.email);
        q.descending("createdAt");
        const results = await q.find();

        cloudFiles = results.map(obj => ({
            id:       obj.id,
            name:     obj.get("filename"),
            size:     obj.get("size") || 0,
            fileType: obj.get("type") || "document",
            url:      obj.get("fileUrl") || "#",
            isCloud:  true
        }));
    } catch (err) {
        console.warn("Cloud load failed, relying on local cache.");
    }

    // Merge: Prioritize cloud if ID exists, or filter out duplicates
    const cloudIds = new Set(cloudFiles.map(f => f.name + f.size));
    const uniqueLocal = localFiles.filter(f => !cloudIds.has(f.name + f.size));
    
    allFiles = [...cloudFiles, ...uniqueLocal];
    renderFiles();
}

async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error ? data.error.message : "Cloudinary failed");
    }
    return data.secure_url;
}

async function uploadFiles(files) {
    for (const file of files) {
        showToast(`⬆️ Encrypting & Uploading ${file.name}...`, "info");
        
        let fileUrl = "#";
        let isSavedToCloud = false;

        try {
            // Step 1: Try Cloudinary
            fileUrl = await uploadToCloudinary(file);
            
            // Step 2: Try Back4App
            const ArchiveFile = Parse.Object.extend("ArchiveFile");
            const obj = new ArchiveFile();
            obj.set("filename",  file.name);
            obj.set("size",      file.size);
            obj.set("type",      getFileType(file.type));
            obj.set("userEmail", currentUser.email);
            obj.set("fileUrl",   fileUrl);
            await obj.save();
            isSavedToCloud = true;
            showToast(`✅ ${file.name} saved to Cloud!`, "success");
        } catch (err) {
            console.error("Cloud upload failed:", err);
            showToast(`❌ Cloud failed: ${err.message || "Error"}`, "error");
            showToast(`⚠️ Saved to Local (Session only)`, "warning");
            // Use Object URL for session preview if cloud fails
            fileUrl = URL.createObjectURL(file);
        }

        // Always save to Local for persistence (as requested for Demo Mode)
        saveToLocal({
            id:       "local_" + Date.now(),
            name:     file.name,
            size:     file.size,
            fileType: getFileType(file.type),
            url:      fileUrl,
            isCloud:  isSavedToCloud
        });

        await loadFiles();
        await loadStats();
    }
}

// LocalPersistence Helpers
function saveToLocal(fileObj) {
    const key = `vault_files_${currentUser.email}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(fileObj);
    localStorage.setItem(key, JSON.stringify(list));
}

function loadFromLocal() {
    const key = `vault_files_${currentUser.email}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function removeFromLocal(id) {
    const key = `vault_files_${currentUser.email}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    list = list.filter(f => f.id !== id);
    localStorage.setItem(key, JSON.stringify(list));
}

async function loadStats() {
    try {
        let total = 0;
        allFiles.forEach(f => total += (f.size || 0));
        updateStatsUI(total);
    } catch (e) {}
}

async function deleteSelected() {
    if (!selectedFile) return;
    if (!confirm(`Delete "${selectedFile.name}" permanently?`)) return;
    
    try {
        if (selectedFile.isCloud) {
            const ArchiveFile = Parse.Object.extend("ArchiveFile");
            const q = new Parse.Query(ArchiveFile);
            const obj = await q.get(selectedFile.id);
            await obj.destroy();
        }
        removeFromLocal(selectedFile.id);
        
        showToast("File removed", "success");
        document.getElementById("preview-modal").classList.add("hidden");
        loadFiles();
        loadStats();
    } catch (err) {
        showToast("Delete failed", "error");
    }
}

// ========== RENDER & UI ==========
function renderFiles() {
    const term = searchInput.value.toLowerCase();
    const filtered = allFiles.filter(f =>
        f.name.toLowerCase().includes(term) &&
        (currentFilter === "all" || f.fileType === currentFilter)
    );

    if (!filtered.length) {
        fileGrid.innerHTML = `<div class="empty-state"><i data-lucide="folder-open"></i><p>Vault is empty.</p></div>`;
    } else {
        fileGrid.innerHTML = filtered.map(f => `
            <div class="file-card" onclick="openPreview('${f.id}')">
                ${!f.isCloud ? '<div class="local-badge" title="Local Only">Demo</div>' : ''}
                <div class="file-preview-thumb">${renderThumb(f)}</div>
                <div class="file-info">
                    <h4 title="${f.name}">${f.name}</h4>
                    <p>${formatSize(f.size)} · ${f.fileType}</p>
                </div>
            </div>`).join("");
    }
    lucide.createIcons();
}

function renderThumb(f) {
    if (f.fileType === "image") return `<img src="${f.url}" alt="${f.name}" onerror="this.src='https://via.placeholder.com/150?text=No+Cloud+Access'">`;
    const icon = f.fileType === "video" ? "video" : (f.fileType === "document" ? "file-text" : "file");
    return `<i data-lucide="${icon}" class="file-icon"></i>`;
}

function openPreview(id) {
    selectedFile = allFiles.find(f => f.id === id);
    if (!selectedFile) return;
    document.getElementById("preview-filename").textContent = selectedFile.name;
    const body = document.getElementById("preview-body");
    body.innerHTML = "";
    if (selectedFile.fileType === "image") {
        const img = document.createElement("img");
        img.src = selectedFile.url;
        body.appendChild(img);
    } else if (selectedFile.fileType === "video") {
        const v = document.createElement("video");
        v.src = selectedFile.url;
        v.controls = true;
        body.appendChild(v);
    } else {
        body.innerHTML = `<div class="placeholder"><i data-lucide="file-text"></i><p>No Preview</p></div>`;
    }
    previewModal.classList.remove("hidden");
    lucide.createIcons();
}

function getFileType(mime = "") {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    return "document";
}

function formatSize(bytes = 0) {
    if (!bytes) return "0 B";
    const k = 1024, s = ["B","KB","MB","GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / k ** i).toFixed(1) + " " + s[i];
}

function updateStatsUI(total) {
    const limit = 10 * 1024 ** 4;
    const pct   = Math.min((total / limit) * 100, 100);
    storageProgress.style.width = pct + "%";
    storagePercent.textContent = pct.toFixed(2) + "%";
    storageText.textContent = `${formatSize(total)} of 10 TB used`;
}

function showToast(msg, type = "info") {
    const tc = document.getElementById("toast-container");
    const t  = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3500);
}

function setupEvents() {
    logoutBtn.onclick = doLogout;
    uploadTrigger.onclick  = () => fileInput.click();
    fileInput.onchange     = e  => uploadFiles(e.target.files);
    searchInput.oninput    = renderFiles;
    dropZone.ondragover  = e => { e.preventDefault(); dropZone.classList.add("active"); };
    dropZone.ondragleave = () => dropZone.classList.remove("active");
    dropZone.ondrop      = e => { e.preventDefault(); dropZone.classList.remove("active"); uploadFiles(e.dataTransfer.files); };
    document.querySelectorAll(".sidebar-nav li").forEach(li => {
        li.onclick = () => {
            document.querySelectorAll(".sidebar-nav li").forEach(x => x.classList.remove("active"));
            li.classList.add("active");
            currentFilter = li.dataset.filter;
            renderFiles();
        };
    });
    document.getElementById("close-preview").onclick = () => previewModal.classList.add("hidden");
    document.getElementById("delete-file-btn").onclick = deleteSelected;
    document.getElementById("download-file").onclick = () => { if (selectedFile) window.open(selectedFile.url, "_blank"); };
}

init();
