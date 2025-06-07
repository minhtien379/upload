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

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Pagination variables
let currentPage = 1;
const imagesPerPage = 50;
let totalImages = 0;
let allImages = [];

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        // Reset pagination when switching to gallery tab
        if (tabId === 'gallery-tab') {
            currentPage = 1;
            updatePagination();
        }
    });
});

// Variables for delete functionality
let currentImageToDelete = null;

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
        loadImagesBtn.disabled = true;
        loadImagesBtn.textContent = 'Đang tải...';
        
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
        
    } catch (error) {
        showResult(`Lỗi khi tải danh sách ảnh: ${error.message}`, false);
        console.error('Load images error:', error);
    } finally {
        loadImagesBtn.disabled = false;
        loadImagesBtn.textContent = 'Tải danh sách ảnh';
    }
});

// Update pagination and display current page images
function updatePagination() {
    const totalPages = Math.ceil(totalImages / imagesPerPage);
    
    // Update page info
    pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
    
    // Enable/disable pagination buttons
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Show pagination only if there's more than one page
    paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
    
    // Display images for current page
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
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Đang xóa...';
        
        await deleteImageFromGitHub(githubUsername, repoName, githubToken, currentImageToDelete);
        
        // Update the images list after deletion
        const images = await getCurrentImages(githubUsername, repoName, githubToken);
        allImages = images;
        totalImages = images.length;
        totalImagesCount.textContent = totalImages;
        
        // Adjust current page if needed
        const totalPages = Math.ceil(totalImages / imagesPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 1;
        }
        
        updatePagination();
        
        showResult(`Đã xóa ảnh ${currentImageToDelete.filename} thành công`, true);
        
    } catch (error) {
        showResult(`Lỗi khi xóa ảnh: ${error.message}`, false);
        console.error('Delete image error:', error);
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Xóa';
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

// Calculate image hash
async function calculateImageHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const buffer = await (await fetch(e.target.result)).arrayBuffer();
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Check for duplicate images
async function checkDuplicateImage(username, repo, token, file) {
    try {
        const currentImages = await getCurrentImages(username, repo, token);
        const newImageHash = await calculateImageHash(file);
        
        for (const image of currentImages) {
            try {
                const blob = await (await fetch(image.path)).blob();
                const existingImageHash = await calculateImageHash(blob);
                if (newImageHash === existingImageHash) return true;
            } catch (error) {
                console.error(`Error checking image ${image.filename}:`, error);
                continue;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking duplicate images:', error);
        return false;
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
        progressContainer.style.display = 'block';
        uploadBtn.disabled = true;
        
        let successCount = 0;
        let duplicateCount = 0;
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
                const isDuplicate = await checkDuplicateImage(githubUsername, repoName, githubToken, file);
                if (isDuplicate) {
                    results.push({ filename: file.name, error: 'Ảnh đã tồn tại trong thư viện' });
                    duplicateCount++;
                    continue;
                }
                
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
            
            // Update the gallery if we're on that tab
            if (document.querySelector('.tab-btn[data-tab="gallery-tab"]').classList.contains('active')) {
                allImages = currentImages;
                updatePagination();
            }
        }
        
        showUploadResults(results, successCount, files.length, duplicateCount);
        
    } catch (error) {
        showResult(`Lỗi: ${error.message}`, false);
        console.error('Upload error:', error);
    } finally {
        uploadBtn.disabled = false;
        progressContainer.style.display = 'none';
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

function showUploadResults(results, successCount, totalCount, duplicateCount = 0) {
    let html = `<div class="${successCount === totalCount ? 'success' : 'error'}">`;
    html += `<h3>Kết quả upload (${successCount}/${totalCount} thành công, ${duplicateCount} trùng lặp)</h3>`;
    
    results.forEach(result => {
        if (result.path) {
            html += `<p><strong>${result.filename}</strong> - <a href="${result.path}" target="_blank">Xem ảnh</a></p>`;
        } else {
            const color = result.error.includes('trùng lặp') ? 'orange' : 'red';
            html += `<p><strong>${result.filename}</strong> - <span style="color: ${color};">Lỗi: ${result.error}</span></p>`;
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