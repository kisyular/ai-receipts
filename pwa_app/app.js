// Receipt Scanner PWA - Main JavaScript
class ReceiptScanner {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:8000'; // FastAPI backend URL
        this.currentFile = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkConnectivity();
    }

    bindEvents() {
        // Tab navigation
        document.getElementById('scanTab').addEventListener('click', () => {
            this.switchTab('scan');
        });

        document.getElementById('historyTab').addEventListener('click', () => {
            this.switchTab('history');
            this.loadSavedReceipts();
        });

        // Camera button
        document.getElementById('cameraBtn').addEventListener('click', () => {
            this.openCamera();
        });

        // Gallery button
        document.getElementById('galleryBtn').addEventListener('click', () => {
            this.openGallery();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeReceipt();
        });

        // Change image button
        document.getElementById('changeImageBtn').addEventListener('click', () => {
            this.showUploadSection();
        });



        // New scan button
        document.getElementById('newScanBtn').addEventListener('click', () => {
            this.resetApp();
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.analyzeReceipt();
        });

        // Refresh history button
        document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
            this.loadSavedReceipts();
        });

        // Drag and drop support
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    async openCamera() {
        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Camera is not available on this device');
                return;
            }

            // Create camera modal
            this.createCameraModal();

        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Failed to access camera. Please try selecting from gallery.');
        }
    }

    createCameraModal() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-container">
                <div class="camera-header">
                    <h3>Take Photo</h3>
                    <button class="btn btn-small" id="closeCameraBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <video id="cameraVideo" autoplay playsinline></video>
                <div class="camera-controls">
                    <button class="btn btn-primary" id="captureBtn">
                        <i class="fas fa-camera"></i> Capture
                    </button>
                    <button class="btn btn-secondary" id="switchCameraBtn">
                        <i class="fas fa-sync"></i> Switch Camera
                    </button>
                </div>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .camera-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .camera-container {
                background: white;
                border-radius: 16px;
                padding: 1rem;
                max-width: 90vw;
                max-height: 90vh;
            }
            .camera-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            #cameraVideo {
                width: 100%;
                max-width: 400px;
                border-radius: 8px;
            }
            .camera-controls {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
                justify-content: center;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Start camera
        this.startCamera();

        // Bind camera events
        document.getElementById('closeCameraBtn').addEventListener('click', () => {
            this.stopCamera();
            document.body.removeChild(modal);
        });

        document.getElementById('captureBtn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('switchCameraBtn').addEventListener('click', () => {
            this.switchCamera();
        });
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera
            });
            
            const video = document.getElementById('cameraVideo');
            video.srcObject = stream;
            this.currentStream = stream;
        } catch (error) {
            console.error('Camera start error:', error);
            this.showError('Failed to start camera');
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            this.handleFileSelect(file);
            
            // Close camera modal
            this.stopCamera();
            const modal = document.querySelector('.camera-modal');
            if (modal) {
                document.body.removeChild(modal);
            }
        }, 'image/jpeg', 0.8);
    }

    switchCamera() {
        this.stopCamera();
        this.startCamera();
    }

    openGallery() {
        document.getElementById('fileInput').click();
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB');
            return;
        }

        this.currentFile = file;
        this.showPreview(file);
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
            this.showSection('previewSection');
        };
        reader.readAsDataURL(file);
    }

    async analyzeReceipt() {
        if (!this.currentFile) {
            this.showError('No image selected');
            return;
        }

        this.showSection('loadingSection');
        this.startProgressAnimation();

        try {
            const formData = new FormData();
            formData.append('file', this.currentFile);

            const response = await fetch(`${this.apiUrl}/analyze/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result);

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Failed to analyze receipt. Please check your connection and try again.');
        }
    }

    startProgressAnimation() {
        const progressFill = document.getElementById('progressFill');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 200);

        this.progressInterval = interval;
    }

    stopProgressAnimation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            document.getElementById('progressFill').style.width = '100%';
        }
    }

    displayResults(data) {
        this.stopProgressAnimation();
        
        const resultsContent = document.getElementById('resultsContent');
        
        // Format the data
        const merchant = data.merchant_name || 'N/A';
        const date = data.transaction_date ? new Date(data.transaction_date).toLocaleDateString() : 'N/A';
        const total = data.total ? `$${data.total.toFixed(2)}` : 'N/A';
        const subtotal = data.subtotal ? `$${data.subtotal.toFixed(2)}` : 'N/A';
        const tax = data.tax ? `$${data.tax.toFixed(2)}` : 'N/A';
        const confidence = data.confidence_score ? `${(data.confidence_score * 100).toFixed(1)}%` : 'N/A';

        // Create results HTML
        let html = `
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Merchant:</strong>
                </div>
                <div class="col-6">
                    ${merchant}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Date:</strong>
                </div>
                <div class="col-6">
                    ${date}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Total:</strong>
                </div>
                <div class="col-6">
                    <span class="text-success fw-bold">${total}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Subtotal:</strong>
                </div>
                <div class="col-6">
                    ${subtotal}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Tax:</strong>
                </div>
                <div class="col-6">
                    ${tax}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Confidence:</strong>
                </div>
                <div class="col-6">
                    ${confidence}
                </div>
            </div>
        `;

        // Add items if available
        if (data.items && data.items.length > 0) {
            html += `
                <hr class="my-4">
                <h5 class="mb-3">Items</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-end">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.items.map(item => `
                                <tr>
                                    <td>${item.description || 'Unknown'}</td>
                                    <td class="text-end">$${(item.total_price || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        resultsContent.innerHTML = html;
        this.showSection('resultsSection');
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = ['uploadSection', 'previewSection', 'loadingSection', 'resultsSection', 'errorSection'];
        sections.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

        // Show target section
        document.getElementById(sectionId).style.display = 'block';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showSection('errorSection');
    }

    resetApp() {
        this.currentFile = null;
        this.stopProgressAnimation();
        this.showSection('uploadSection');
        
        // Clear file input
        document.getElementById('fileInput').value = '';
    }

    switchTab(tabName) {
        // Update tab buttons
        document.getElementById('scanTab').classList.toggle('active', tabName === 'scan');
        document.getElementById('historyTab').classList.toggle('active', tabName === 'history');
        
        // Update tab content
        document.getElementById('scanContent').classList.toggle('active', tabName === 'scan');
        document.getElementById('historyContent').classList.toggle('active', tabName === 'history');
    }



    async loadSavedReceipts() {
        const historyContainer = document.getElementById('historyContainer');
        
        try {
            // Show loading state
            historyContainer.innerHTML = `
                <div class="loading-history">
                    <div class="spinner"></div>
                    <p>Loading saved receipts...</p>
                </div>
            `;

            const response = await fetch(`${this.apiUrl}/receipts`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const receipts = await response.json();
            this.displaySavedReceipts(receipts);

        } catch (error) {
            console.error('Load receipts error:', error);
            historyContainer.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load receipts</h3>
                    <p>Please check your connection and try again.</p>
                </div>
            `;
        }
    }

    displaySavedReceipts(receipts) {
        const historyContainer = document.getElementById('historyContainer');
        
        if (!receipts || receipts.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-receipt"></i>
                    <h3>No saved receipts</h3>
                    <p>Scan your first receipt to get started!</p>
                </div>
            `;
            return;
        }

        const receiptsHtml = receipts.map(receipt => {
            const merchant = receipt.merchant_name || 'Unknown Merchant';
            const date = receipt.transaction_date ? new Date(receipt.transaction_date).toLocaleDateString() : 'Unknown Date';
            const total = receipt.total ? `$${receipt.total.toFixed(2)}` : '$0.00';
            const confidence = receipt.confidence_score ? `${(receipt.confidence_score * 100).toFixed(1)}%` : 'N/A';

            return `
                <div class="card receipt-card mb-3">
                    <div class="card-body">
                        <div class="receipt-card-header">
                            <div>
                                <h5 class="receipt-card-title mb-1">${merchant}</h5>
                                <small class="receipt-card-date text-muted">${date}</small>
                            </div>
                            <div class="receipt-card-amount">${total}</div>
                        </div>
                        
                        <div class="receipt-card-details">
                            <div class="receipt-card-detail">
                                <span class="receipt-card-label">Confidence:</span>
                                <span class="receipt-card-value">${confidence}</span>
                            </div>
                            <div class="receipt-card-detail">
                                <span class="receipt-card-label">ID:</span>
                                <span class="receipt-card-value">${receipt.id || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div class="receipt-card-actions d-flex justify-content-between">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.viewReceiptDetails('${receipt.id}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="app.deleteReceipt('${receipt.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        historyContainer.innerHTML = receiptsHtml;
    }

    async viewReceiptDetails(receiptId) {
        console.log('Viewing receipt details for ID:', receiptId);
        
        try {
            // Show loading state in the modal
            this.showReceiptDetailsModal({ loading: true });
            
            const url = `${this.apiUrl}/receipts/${receiptId}`;
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Receipt not found');
                }
                throw new Error(`Server error: ${response.status}`);
            }

            const receipt = await response.json();
            console.log('Receipt data:', receipt);
            
            // Show receipt details in modal
            this.showReceiptDetailsModal(receipt);

        } catch (error) {
            console.error('View receipt error:', error);
            
            // Remove loading modal and show error
            const existingModal = document.querySelector('.receipt-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Show error in a more user-friendly way
            this.showError(`Failed to load receipt details: ${error.message}`);
        }
    }

    showReceiptDetailsModal(receipt) {
        // Remove any existing modals
        const existingModal = document.querySelector('.receipt-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal for receipt details
        const modal = document.createElement('div');
        modal.className = 'receipt-modal';
        
        // Handle loading state
        if (receipt.loading) {
            modal.innerHTML = `
                <div class="receipt-modal-content">
                    <div class="receipt-modal-header">
                        <h3 class="modal-title">Loading Receipt Details</h3>
                        <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close"></button>
                    </div>
                    <div class="receipt-modal-body">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-3">Loading receipt details...</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            modal.innerHTML = `
                <div class="receipt-modal-content">
                    <div class="receipt-modal-header">
                        <h3 class="modal-title">Receipt Details</h3>
                        <button type="button" class="btn-close" id="closeModalBtn" aria-label="Close"></button>
                    </div>
                    <div class="receipt-modal-body">
                        ${this.formatReceiptDetails(receipt)}
                    </div>
                </div>
            `;
        }

        // Add modal styles only if they don't exist
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .receipt-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1050;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    animation: fadeIn 0.3s ease-out;
                }
                .receipt-modal-content {
                    background: white;
                    border-radius: 0.5rem;
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .receipt-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #dee2e6;
                }
                .receipt-modal-body {
                    padding: 1.5rem;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);

        // Add event listener for close button
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            modal.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    formatReceiptDetails(receipt) {
        const merchant = receipt.merchant_name || 'N/A';
        const date = receipt.transaction_date ? new Date(receipt.transaction_date).toLocaleDateString() : 'N/A';
        const total = receipt.total ? `$${receipt.total.toFixed(2)}` : 'N/A';
        const subtotal = receipt.subtotal ? `$${receipt.subtotal.toFixed(2)}` : 'N/A';
        const tax = receipt.tax ? `$${receipt.tax.toFixed(2)}` : 'N/A';
        const confidence = receipt.confidence_score ? `${(receipt.confidence_score * 100).toFixed(1)}%` : 'N/A';

        let html = `
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Merchant:</strong>
                </div>
                <div class="col-6">
                    ${merchant}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Date:</strong>
                </div>
                <div class="col-6">
                    ${date}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Total:</strong>
                </div>
                <div class="col-6">
                    <span class="text-success fw-bold">${total}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Subtotal:</strong>
                </div>
                <div class="col-6">
                    ${subtotal}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Tax:</strong>
                </div>
                <div class="col-6">
                    ${tax}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Confidence:</strong>
                </div>
                <div class="col-6">
                    ${confidence}
                </div>
            </div>
        `;

        if (receipt.items && receipt.items.length > 0) {
            html += `
                <hr class="my-4">
                <h5 class="mb-3">Items</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-end">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receipt.items.map(item => `
                                <tr>
                                    <td>${item.description || 'Unknown'}</td>
                                    <td class="text-end">$${(item.total_price || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        return html;
    }

    async deleteReceipt(receiptId) {
        console.log('Deleting receipt with ID:', receiptId);
        
        if (!confirm('Are you sure you want to delete this receipt?')) {
            return;
        }

        try {
            const url = `${this.apiUrl}/receipts/${receiptId}`;
            console.log('Deleting from URL:', url);
            
            const response = await fetch(url, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Receipt deleted successfully, refreshing list...');
            // Refresh the receipts list
            this.loadSavedReceipts();

        } catch (error) {
            console.error('Delete receipt error:', error);
            this.showError(`Failed to delete receipt: ${error.message}`);
        }
    }

    checkConnectivity() {
        // Check if the API is reachable
        fetch(`${this.apiUrl}/health`, { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    console.warn('API health check failed');
                }
            })
            .catch(error => {
                console.warn('API not reachable:', error);
            });
    }

    // Utility method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ReceiptScanner();
});

// Handle offline/online events
window.addEventListener('online', () => {
    console.log('App is online');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
});

// Service Worker registration is handled in the HTML file 