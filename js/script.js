// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const preview = document.getElementById('preview');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const resultDiv = document.getElementById('result');
const dropArea = document.getElementById('dropArea');
const githubTokenInput = document.getElementById('githubToken');
const loadImagesBtn = document.getElementById('loadImagesBtn');
const galleryContainer = document.getElementById('gallery-container');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeModal = document.querySelector('.close-modal');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const paginationContainer = document.getElementById('paginationContainer');
const totalImagesCount = document.getElementById('totalImagesCount');
const findDuplicatesBtn = document.getElementById('findDuplicatesBtn');
const duplicatesContainer = document.getElementById('duplicates-container');
const duplicatesCount = document.getElementById('duplicatesCount');
const deleteAllDuplicatesBtn = document.getElementById('deleteAllDuplicatesBtn');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Global variables
let currentPage = 1;
const imagesPerPage = 50;
let totalImages = 0;
let allImages = [];
let duplicateGroupsData = [];

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'gallery-tab') {
            currentPage = 1;
            updatePagination();
        }
        
        if (tabId === 'duplicates-tab' && duplicatesContainer.innerHTML.includes('Nhấn "Tìm ảnh trùng"')) {
            if (allImages.length > 0) {
                findDuplicatesBtn.disabled = false;
            }
        }
    });
});

// Drag and drop handlers
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#2ea44f';
    dropArea.style.backgroundColor = '#f1f8ff';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = '#ccc';
    dropArea.style.backgroundColor = '';
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#ccc';
    dropArea.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFiles(fileInput.files);
    }
});

// File input change handler
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
    }
});

// Display image preview
function handleFiles(files) {
    preview.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        if (!file.type.match('image.*')) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => removeImage(index);
            
            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            preview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
    
    uploadBtn.disabled = files.length === 0;
}

// Remove image from preview
function removeImage(index) {
    const newFiles = Array.from(fileInput.files);
    newFiles.splice(index, 1);
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    
    handleFiles(fileInput.files);
    uploadBtn.disabled = fileInput.files.length === 0;
}

// Calculate image hash using SHA-256
async function calculateImageHash(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error calculating hash:', error);
        return null;
    }
}

// Find duplicate images
findDuplicatesBtn.addEventListener('click', async () => {
    try {
        const icon = findDuplicatesBtn.querySelector('i');
        const text = findDuplicatesBtn.querySelector('.btn-text');
        
        findDuplicatesBtn.disabled = true;
        icon.classList.replace('fa-clone', 'fa-spinner', 'fa-pulse');
        text.textContent = ' Đang Tìm...';
        
        duplicatesContainer.innerHTML = '<p>Đang tìm kiếm ảnh trùng lặp...</p>';
        
        // Calculate hashes for all images
        const hashMap = {};
        
        // Process images in batches to avoid freezing UI
        const batchSize = 5;
        for (let i = 0; i < allImages.length; i += batchSize) {
            const batch = allImages.slice(i, i + batchSize);
            await Promise.all(batch.map(async (image) => {
                const hash = await calculateImageHash(image.path);
                if (hash) {
                    if (!hashMap[hash]) {
                        hashMap[hash] = [];
                    }
                    hashMap[hash].push(image);
                }
            }));
        }
        
        // Store duplicate groups data globally
        duplicateGroupsData = Object.values(hashMap).filter(group => group.length > 1);
        duplicatesCount.textContent = duplicateGroupsData.length;
        
        // Enable/disable delete all button
        deleteAllDuplicatesBtn.disabled = duplicateGroupsData.length === 0;
        
        if (duplicateGroupsData.length === 0) {
            duplicatesContainer.innerHTML = '<p>Không tìm thấy ảnh trùng lặp</p>';
            return;
        }
        
        // Display duplicate groups
        displayDuplicateGroups(duplicateGroupsData);
        
    } catch (error) {
        showResult(`Lỗi khi tìm ảnh trùng: ${error.message}`, false);
        console.error('Find duplicates error:', error);
    } finally {
        const icon = findDuplicatesBtn.querySelector('i');
        const text = findDuplicatesBtn.querySelector('.btn-text');
        
        findDuplicatesBtn.disabled = false;
        icon.classList.replace('fa-spinner', 'fa-clone');
        icon.classList.remove('fa-pulse');
        text.textContent = ' Tìm ảnh trùng';
    }
});

// Display duplicate groups
function displayDuplicateGroups(groups) {
    let html = '';
    groups.forEach((group, index) => {
        html += `<div class="duplicate-group">
                    <div class="duplicate-group-header">
                        <span>Nhóm ảnh trùng ${index + 1} (${group.length} ảnh)</span>
                        <button class="btn btn-danger btn-sm" onclick="deleteAllButOne(${index})">
                            <i class="fa-solid fa-trash"></i> <span>Xóa chỉ giữ lại 1 ảnh</span>
                        </button>
                    </div>
                    <div class="duplicate-images">`;
        
        group.forEach((image, idx) => {
            html += `<div class="duplicate-image">
                        <img src="${image.path}" alt="${image.filename}">
                        <button class="delete-btn" onclick="showDeleteModal(${JSON.stringify(image).replace(/"/g, '&quot;')})">×</button>
                        <div class="duplicate-info">${idx === 0 ? '(Giữ lại)' : ''}</div>
                    </div>`;
        });
        
        html += `</div></div>`;
    });
    
    duplicatesContainer.innerHTML = html;
}

// Delete all but one image in a duplicate group
window.deleteAllButOne = async function(groupIndex) {
    const githubUsername = 'minhtien379';
    const repoName = 'upload';
    const githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showResult('Vui lòng nhập GitHub Token', false);
        return;
    }
    
    const group = duplicateGroupsData[groupIndex];
    if (!group || group.length <= 1) {
        showResult('Không tìm thấy nhóm ảnh trùng để xóa', false);
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${group.length - 1} ảnh trùng và chỉ giữ lại 1 ảnh trong nhóm này?`)) {
        return;
    }
    
    try {
        // Delete all images except the first one
        const imagesToDelete = group.slice(1);
        let successCount = 0;
        
        for (const image of imagesToDelete) {
            try {
                await deleteImageFromGitHub(githubUsername, repoName, githubToken, image);
                successCount++;
            } catch (error) {
                console.error(`Error deleting image ${image.filename}:`, error);
            }
        }
        
        // Reload images
        const images = await getCurrentImages(githubUsername, repoName, githubToken);
        allImages = images;
        totalImages = images.length;
        totalImagesCount.textContent = totalImages;
        
        // Update gallery if active
        if (document.querySelector('.tab-btn[data-tab="gallery-tab"]').classList.contains('active')) {
            updatePagination();
        }
        
        // Refresh duplicates display
        findDuplicatesBtn.click();
        
        showResult(`Đã xóa ${successCount}/${imagesToDelete.length} ảnh trùng, giữ lại 1 ảnh trong nhóm`, true);
        
    } catch (error) {
        showResult(`Lỗi khi xóa ảnh trùng: ${error.message}`, false);
        console.error('Delete duplicates error:', error);
    }
};

// Delete all duplicate images (keep one from each group)
deleteAllDuplicatesBtn.addEventListener('click', async () => {
    const githubUsername = 'minhtien379';
    const repoName = 'upload';
    const githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showResult('Vui lòng nhập GitHub Token', false);
        return;
    }
    
    if (duplicateGroupsData.length === 0) {
        showResult('Không có ảnh trùng để xóa', false);
        return;
    }
    
    // Calculate total images to delete
    const totalToDelete = duplicateGroupsData.reduce((sum, group) => sum + (group.length - 1), 0);
    
    if (!confirm(`Bạn có chắc muốn xóa tất cả ${totalToDelete} ảnh trùng và chỉ giữ lại 1 ảnh trong mỗi nhóm (${duplicateGroupsData.length} nhóm)?`)) {
        return;
    }
    
    try {
        const icon = deleteAllDuplicatesBtn.querySelector('i');
        const text = deleteAllDuplicatesBtn.querySelector('.btn-text');
        
        deleteAllDuplicatesBtn.disabled = true;
        icon.classList.replace('fa-trash', 'fa-spinner', 'fa-pulse');
        text.textContent = ' Đang xóa...';
        
        let totalDeleted = 0;
        
        // Process each group
        for (const group of duplicateGroupsData) {
            // Delete all images except the first one
            const imagesToDelete = group.slice(1);
            
            for (const image of imagesToDelete) {
                try {
                    await deleteImageFromGitHub(githubUsername, repoName, githubToken, image);
                    totalDeleted++;
                } catch (error) {
                    console.error(`Error deleting image ${image.filename}:`, error);
                }
            }
        }
        
        // Reload images
        const images = await getCurrentImages(githubUsername, repoName, githubToken);
        allImages = images;
        totalImages = images.length;
        totalImagesCount.textContent = totalImages;
        
        // Update gallery if active
        if (document.querySelector('.tab-btn[data-tab="gallery-tab"]').classList.contains('active')) {
            updatePagination();
        }
        
        // Reset duplicates display
        duplicateGroupsData = [];
        duplicatesCount.textContent = '0';
        duplicatesContainer.innerHTML = '<p>Nhấn "Tìm ảnh trùng" để tìm các ảnh trùng lặp</p>';
        
        showResult(`Đã xóa ${totalDeleted}/${totalToDelete} ảnh trùng, giữ lại 1 ảnh trong mỗi nhóm`, true);
        
    } catch (error) {
        showResult(`Lỗi khi xóa ảnh trùng: ${error.message}`, false);
        console.error('Delete all duplicates error:', error);
    } finally {
        const icon = deleteAllDuplicatesBtn.querySelector('i');
        const text = deleteAllDuplicatesBtn.querySelector('.btn-text');
        
        deleteAllDuplicatesBtn.disabled = duplicateGroupsData.length === 0;
        icon.classList.replace('fa-spinner', 'fa-trash');
        icon.classList.remove('fa-pulse');
        text.textContent = ' Xóa tất cả ảnh trùng';
    }
});

// Load images from GitHub
loadImagesBtn.addEventListener('click', async () => {
    const githubUsername = 'minhtien379';
    const repoName = 'upload';
    const githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showResult('Vui lòng nhập GitHub Token', false);
        return;
    }
    
    try {
        const icon = loadImagesBtn.querySelector('i');
        const text = loadImagesBtn.querySelector('.btn-text');
        
        loadImagesBtn.disabled = true;
        icon.classList.replace('fa-rotate', 'fa-spinner', 'fa-pulse');
        text.textContent = ' Đang Tải...';
        
        const images = await getCurrentImages(githubUsername, repoName, githubToken);
        allImages = images;
        totalImages = images.length;
        totalImagesCount.textContent = totalImages;
        
        if (images.length === 0) {
            galleryContainer.innerHTML = '<p>Không có ảnh nào trong thư viện</p>';
            paginationContainer.style.display = 'none';
        } else {
            updatePagination();
        }
        
        findDuplicatesBtn.disabled = images.length === 0;
        deleteAllDuplicatesBtn.disabled = true;
        
    } catch (error) {
        showResult(`Lỗi khi tải danh sách ảnh: ${error.message}`, false);
        console.error('Load images error:', error);
    } finally {
        const icon = loadImagesBtn.querySelector('i');
        const text = loadImagesBtn.querySelector('.btn-text');
        
        loadImagesBtn.disabled = false;
        icon.classList.replace('fa-spinner', 'fa-rotate');
        icon.classList.remove('fa-pulse');
        text.textContent = ' Tải danh sách ảnh';
    }
});

// Update pagination and display current page images
function updatePagination() {
    const totalPages = Math.ceil(totalImages / imagesPerPage);
    
    pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
    
    displayCurrentPageImages();
}

// Display images for the current page
function displayCurrentPageImages() {
    galleryContainer.innerHTML = '';
    
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = Math.min(startIndex + imagesPerPage, totalImages);
    const imagesToDisplay = allImages.slice(startIndex, endIndex);
    
    if (imagesToDisplay.length === 0) {
        galleryContainer.innerHTML = '<p>Không có ảnh nào để hiển thị</p>';
        return;
    }
    
    imagesToDisplay.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = image.path;
        img.alt = image.filename;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            showDeleteModal(image);
        };
        
        galleryItem.appendChild(img);
        galleryItem.appendChild(deleteBtn);
        galleryContainer.appendChild(galleryItem);
    });
}

// Pagination event listeners
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalImages / imagesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
});

// Delete modal handlers
function showDeleteModal(image) {
    currentImageToDelete = image;
    deleteModal.style.display = 'block';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    currentImageToDelete = null;
}

closeModal.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Confirm delete image
confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentImageToDelete) return;
    
    const githubUsername = 'minhtien379';
    const repoName = 'upload';
    const githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showResult('Vui lòng nhập GitHub Token', false);
        closeDeleteModal();
        return;
    }
    
    try {
        const icon = confirmDeleteBtn.querySelector('i');
        const text = confirmDeleteBtn.querySelector('span');
        
        confirmDeleteBtn.disabled = true;
        icon.classList.replace('fa-trash', 'fa-spinner', 'fa-pulse');
        text.textContent = ' Đang Xóa...';
        
        await deleteImageFromGitHub(githubUsername, repoName, githubToken, currentImageToDelete);
        
        const images = await getCurrentImages(githubUsername, repoName, githubToken);
        allImages = images;
        totalImages = images.length;
        totalImagesCount.textContent = totalImages;
        
        const totalPages = Math.ceil(totalImages / imagesPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 1;
        }
        
        updatePagination();
        
        if (document.querySelector('.tab-btn[data-tab="duplicates-tab"]').classList.contains('active')) {
            findDuplicatesBtn.click();
        }
        
        showResult(`Đã xóa ảnh ${currentImageToDelete.filename} thành công`, true);
        
    } catch (error) {
        showResult(`Lỗi khi xóa ảnh: ${error.message}`, false);
        console.error('Delete image error:', error);
    } finally {
        const icon = confirmDeleteBtn.querySelector('i');
        const text = confirmDeleteBtn.querySelector('span');
        
        confirmDeleteBtn.disabled = false;
        icon.classList.replace('fa-spinner', 'fa-trash');
        icon.classList.remove('fa-pulse');
        text.textContent = ' Xóa';
        closeDeleteModal();
    }
});

// Delete image from GitHub
async function deleteImageFromGitHub(username, repo, token, image) {
    try {
        const imagePath = `images/${image.filename}`;
        await deleteGitHubFile(username, repo, token, imagePath, `Xóa ảnh ${image.filename}`);
        
        let currentImages = await getCurrentImages(username, repo, token);
        currentImages = currentImages.filter(img => img.id !== image.id);
        
        await updateImagesJson(username, repo, token, currentImages);
    } catch (error) {
        throw error;
    }
}

// Upload images to GitHub
uploadBtn.addEventListener('click', async () => {
    const githubUsername = 'minhtien379';
    const repoName = 'upload';
    const githubToken = githubTokenInput.value.trim();
    
    if (!githubToken) {
        showResult('Vui lòng nhập GitHub Token', false);
        return;
    }

    const files = fileInput.files;
    if (files.length === 0) {
        showResult('Vui lòng chọn ít nhất một hình ảnh', false);
        return;
    }
    
    try {
        const icon = uploadBtn.querySelector('i');
        const text = uploadBtn.querySelector('.btn-text');
        
        progressContainer.style.display = 'block';
        uploadBtn.disabled = true;
        icon.classList.replace('fa-cloud-arrow-up', 'fa-spinner', 'fa-pulse');
        text.textContent = ' Đang Upload...';
        
        let successCount = 0;
        const results = [];
        const currentImages = await getCurrentImages(githubUsername, repoName, githubToken);
        const existingFilenames = currentImages.map(img => img.filename);
        
        const usedIds = currentImages.map(img => img.id).sort((a, b) => a - b);
        let availableIds = [];
        
        if (usedIds.length > 0) {
            const maxId = Math.max(...usedIds);
            for (let i = 1; i <= maxId; i++) {
                if (!usedIds.includes(i)) availableIds.push(i);
            }
        }
        
        let nextId = usedIds.length > 0 ? Math.max(...usedIds) + 1 : 1;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.match('image.*')) continue;
            
            progressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
            progressBar.textContent = `${Math.round(((i + 1) / files.length) * 100)}%`;
            
            try {
                const base64Content = await readFileAsBase64(file);
                const fileExtension = file.name.split('.').pop().toLowerCase() || 'jpg';
                const imageId = availableIds.length > 0 ? availableIds.shift() : nextId++;
                
                let filename = `image_${imageId}.${fileExtension}`;
                let counter = 1;
                while (existingFilenames.includes(filename)) {
                    filename = `image_${imageId}_${counter}.${fileExtension}`;
                    counter++;
                }
                
                existingFilenames.push(filename);
                
                const uploadResponse = await uploadToGitHub(
                    githubUsername,
                    repoName,
                    githubToken,
                    `images/${filename}`,
                    base64Content,
                    `Upload image ${filename}`
                );
                
                if (uploadResponse.content) {
                    successCount++;
                    const newImage = {
                        id: imageId,
                        filename: filename,
                        path: uploadResponse.content.download_url
                    };
                    currentImages.push(newImage);
                    results.push(newImage);
                } else {
                    results.push({ filename: file.name, error: uploadResponse.message || 'Unknown error' });
                }
            } catch (error) {
                results.push({ filename: file.name, error: error.message });
            }
        }
        
        if (successCount > 0) {
            await updateImagesJson(githubUsername, repoName, githubToken, currentImages);
            totalImages = currentImages.length;
            totalImagesCount.textContent = totalImages;
            
            if (document.querySelector('.tab-btn[data-tab="gallery-tab"]').classList.contains('active')) {
                allImages = currentImages;
                updatePagination();
            }
            
            findDuplicatesBtn.disabled = false;
        }
        
        showUploadResults(results, successCount, files.length);
        
    } catch (error) {
        showResult(`Lỗi: ${error.message}`, false);
        console.error('Upload error:', error);
    } finally {
        const icon = uploadBtn.querySelector('i');
        const text = uploadBtn.querySelector('.btn-text');
        
        uploadBtn.disabled = false;
        progressContainer.style.display = 'none';
        icon.classList.replace('fa-spinner', 'fa-cloud-arrow-up');
        icon.classList.remove('fa-pulse');
        text.textContent = ' Upload Ảnh';
    }
});

// Helper functions
async function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadToGitHub(username, repo, token, path, content, message) {
    const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
    
    let sha = null;
    try {
        const getResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (getResponse.ok) sha = (await getResponse.json()).sha;
    } catch (error) {
        console.log('File chưa tồn tại, sẽ tạo mới');
    }
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: message,
            content: content,
            sha: sha || undefined,
            branch: 'main'
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload');
    }
    
    return await response.json();
}

async function getCurrentImages(username, repo, token) {
    try {
        const url = `https://api.github.com/repos/${username}/${repo}/contents/data/images.json`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.status === 404) return [];
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        return JSON.parse(atob(data.content.replace(/\s/g, ''))).images || [];
    } catch (error) {
        if (error.message.includes('404')) return [];
        console.error('Error getting current images:', error);
        return [];
    }
}

async function updateImagesJson(username, repo, token, images) {
    try {
        let currentSha = null;
        try {
            const getResponse = await fetch(
                `https://api.github.com/repos/${username}/${repo}/contents/data/images.json`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            if (getResponse.ok) currentSha = (await getResponse.json()).sha;
        } catch (error) {
            console.log('File images.json chưa tồn tại, sẽ tạo mới');
        }
        
        const sortedImages = [...images].sort((a, b) => a.id - b.id);
        const newContent = { images: sortedImages };
        
        const putResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/data/images.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Update images.json with ${sortedImages.length} images`,
                    content: btoa(JSON.stringify(newContent, null, 2)),
                    sha: currentSha || undefined,
                    branch: 'main'
                })
            }
        );
        
        if (!putResponse.ok) {
            throw new Error((await putResponse.json()).message || 'Failed to update images.json');
        }
        
        return await putResponse.json();
    } catch (error) {
        console.error('Error updating images.json:', error);
        throw error;
    }
}

async function deleteGitHubFile(username, repo, token, path, message) {
    try {
        const getUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!getResponse.ok) {
            if (getResponse.status === 404) return { status: 'already_deleted' };
            throw new Error('Không tìm thấy file để xóa');
        }
        
        const fileData = await getResponse.json();
        
        const deleteResponse = await fetch(getUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: message,
                sha: fileData.sha,
                branch: 'main'
            })
        });
        
        if (!deleteResponse.ok) {
            throw new Error((await deleteResponse.json()).message || 'Failed to delete file');
        }
        
        return await deleteResponse.json();
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

function showUploadResults(results, successCount, totalCount) {
    let html = `<div class="${successCount === totalCount ? 'success' : 'error'}">`;
    html += `<h3>Kết quả upload (${successCount}/${totalCount} thành công)</h3>`;
    
    results.forEach(result => {
        if (result.path) {
            html += `<p><strong>${result.filename}</strong> - <a href="${result.path}" target="_blank">Xem ảnh</a></p>`;
        } else {
            html += `<p><strong>${result.filename}</strong> - <span style="color: red;">Lỗi: ${result.error}</span></p>`;
        }
    });
    
    resultDiv.innerHTML = html + `</div>`;
    
    if (successCount === totalCount && successCount > 0) {
        setTimeout(() => {
            fileInput.value = '';
            preview.innerHTML = '';
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }, 1000);
    }
}

function showResult(message, isSuccess) {
    resultDiv.innerHTML = `
        <div class="${isSuccess ? 'success' : 'error'}">
            <p>${message}</p>
        </div>
    `;
}
