// ========== BACK4APP CONFIG ==========
Parse.initialize(
    "dKR9Ht5Moa9biA0oVlwW5XVpFxsdnlTBU6M0nkjG",
    "iRZOpPRdlfE4ZmPBTkn0zvSTANiMtDtR07CpJ2vp"
);
Parse.serverURL = "https://parseapi.back4app.com/";

// ========== EMAILJS CONFIG ==========
const EMAILJS_SERVICE  = "service_10hbfpn";
const EMAILJS_TEMPLATE = "template_eycxtak";

// ========== STATE ==========
let currentUser  = null;
let allFiles     = [];
let currentFilter = "all";
let selectedFile = null;
let currentOTP   = null;
let targetEmail  = "";

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
    showAuth();              // Always start at login
}

// ========== AUTH: SHOW/HIDE ==========
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

// ========== OTP FLOW ==========
async function handleRequestOTP(e) {
    e.preventDefault();
    targetEmail = document.getElementById("login-email").value.trim();
    const btn   = document.getElementById("send-otp-btn");

    currentOTP = Math.floor(100000 + Math.random() * 900000);
    console.log("Dev OTP:", currentOTP);   // visible in browser console for local testing

    btn.disabled    = true;
    btn.textContent = "Sending...";

    try {
        const response = await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            to_email: targetEmail,
            otp_code: currentOTP,
            user_email: targetEmail, // variation 1
            code: currentOTP          // variation 2
        });
        console.log("Email Success:", response);
        showToast("Code sent to " + targetEmail, "success");
    } catch (err) {
        console.error("Email Error:", err);
        showToast("EmailJS Error: " + (err.text || err.message || "Unknown error"), "error");
    }

    btn.disabled    = false;
    btn.innerHTML   = '<i data-lucide="send"></i> Send OTP Code';
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

// ========== LOGOUT ==========
function doLogout() {
    currentUser = null;
    allFiles    = [];
    fileGrid.innerHTML = "";
    showAuth();
    showEmailStep();    // Reset back to email step
    document.getElementById("login-email").value     = "";
    document.getElementById("native-otp-input").value = "";
    showToast("Logged out", "info");
}

// ========== BACK4APP CLOUD SYNC ==========
async function loadFiles() {
    fileGrid.innerHTML = `<div class="empty-state"><div class="loader"></div><p>Loading your files...</p></div>`;
    lucide.createIcons();

    try {
        const ArchiveFile = Parse.Object.extend("ArchiveFile");
        const q = new Parse.Query(ArchiveFile);
        q.equalTo("userEmail", currentUser.email);
        q.descending("createdAt");
        const results = await q.find();

        allFiles = results.map(obj => ({
            id:       obj.id,
            name:     obj.get("filename"),
            size:     obj.get("size") || 0,
            fileType: obj.get("type") || "document",
            url:      obj.get("fileUrl") || "#"   // ← Now reads Cloudinary URL
        }));
        renderFiles();
    } catch (err) {
        console.error("Load error:", err);
        fileGrid.innerHTML = `<div class="empty-state"><i data-lucide="cloud-off"></i><p>Could not load files.<br><small>${err.message}</small></p></div>`;
        lucide.createIcons();
    }
}


// ========== CLOUDINARY CONFIG ==========
// Get your Cloud Name from: https://cloudinary.com/console
// Then create an unsigned upload preset named "vault_upload"
const CLOUDINARY_CLOUD_NAME = "dmxnbdmaf";
const CLOUDINARY_UPLOAD_PRESET = "vault_upload";

async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    console.log("📤 Uploading to Cloudinary:", url);
    console.log("☁️ Cloud Name:", CLOUDINARY_CLOUD_NAME);
    console.log("🔑 Upload Preset:", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
        const msg = data.error ? data.error.message : JSON.stringify(data);
        console.error("❌ Cloudinary Error Response:", data);
        if (msg.includes("preset")) {
            throw new Error("⚠️ Upload failed: 'vault_upload' preset is missing or set to Signed. Go to Cloudinary → Settings → Upload → Add Unsigned Preset named 'vault_upload'");
        }
        throw new Error("❌ Cloudinary: " + msg);
    }
    console.log("✅ Cloudinary upload success:", data.secure_url);
    return data.secure_url;
}

async function uploadFiles(files) {
    for (const file of files) {
        showToast(`⬆️ Uploading ${file.name}...`, "info");
        try {
            // Step 1: Upload file to Cloudinary CDN
            const fileUrl = await uploadToCloudinary(file);

            // Step 2: Save metadata to Back4App
            const ArchiveFile = Parse.Object.extend("ArchiveFile");
            const obj = new ArchiveFile();
            obj.set("filename",  file.name);
            obj.set("size",      file.size);
            obj.set("type",      getFileType(file.type));
            obj.set("userEmail", currentUser.email);
            obj.set("fileUrl",   fileUrl);
            await obj.save();

            showToast(`✅ ${file.name} saved!`, "success");
            await loadFiles();
            await loadStats();
        } catch (err) {
            console.error("Upload error:", err);
            showToast("❌ " + (err.message || "Upload failed"), "error");
        }
    }
}

async function loadStats() {
    try {
        const ArchiveFile = Parse.Object.extend("ArchiveFile");
        const q = new Parse.Query(ArchiveFile);
        q.equalTo("userEmail", currentUser.email);
        const results = await q.find();
        let total = 0;
        results.forEach(f => total += (f.get("size") || 0));
        updateStatsUI(total);
    } catch (e) {}
}

async function deleteSelected() {
    if (!selectedFile) return;
    if (!confirm(`Delete "${selectedFile.name}" permanently?`)) return;
    try {
        const ArchiveFile = Parse.Object.extend("ArchiveFile");
        const q = new Parse.Query(ArchiveFile);
        const obj = await q.get(selectedFile.id);
        await obj.destroy();
        showToast("File deleted from cloud", "success");
        document.getElementById("preview-modal").classList.add("hidden");
        loadFiles();
        loadStats();
    } catch (err) {
        showToast("Delete failed: " + err.message, "error");
    }
}

// ========== RENDER ==========
function renderFiles() {
    const term = searchInput.value.toLowerCase();
    const filtered = allFiles.filter(f =>
        f.name.toLowerCase().includes(term) &&
        (currentFilter === "all" || f.fileType === currentFilter)
    );

    if (!filtered.length) {
        fileGrid.innerHTML = `<div class="empty-state"><i data-lucide="folder-open"></i><p>No files yet. Click Upload to start!</p></div>`;
    } else {
        fileGrid.innerHTML = filtered.map(f => `
            <div class="file-card" onclick="openPreview('${f.id}')">
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
    if (f.fileType === "image") return `<img src="${f.url}" alt="${f.name}" onerror="this.style.display='none'">`;
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

// ========== HELPERS ==========
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
    storageProgress.style.width    = pct + "%";
    storagePercent.textContent     = pct.toFixed(2) + "%";
    storageText.textContent        = `${formatSize(total)} of 10 TB used`;
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

// ========== EVENTS ==========
function setupEvents() {
    logoutBtn.onclick = doLogout;

    uploadTrigger.onclick  = () => fileInput.click();
    fileInput.onchange     = e  => uploadFiles(e.target.files);
    searchInput.oninput    = renderFiles;

    dropZone.ondragover  = e => { e.preventDefault(); dropZone.classList.add("active"); };
    dropZone.ondragleave = () => dropZone.classList.remove("active");
    dropZone.ondrop      = e => {
        e.preventDefault();
        dropZone.classList.remove("active");
        uploadFiles(e.dataTransfer.files);
    };

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
    document.getElementById("download-file").onclick = () => {
        if (selectedFile) window.open(selectedFile.url, "_blank");
    };
}

// ========== START ==========
init();
