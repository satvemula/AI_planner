/**
 * Notebook 3D Component using Three.js
 * Creates a notebook-style interface with page-flip animations
 */

import * as THREE from 'three';

let scene, camera, renderer;
let notebookCover, currentPage, nextPage;
let isAnimating = false;
let currentTab = 'home';
let pages = {};

/**
 * Initialize the notebook 3D scene
 */
export async function initNotebook() {
    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f0); // Paper-like background

        // Create camera
        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);

        // Create renderer
        const container = document.getElementById('notebook-container');
        if (!container) {
            console.error('Notebook container not found');
            return;
        }

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Create notebook cover
        createNotebookCover();

        // Create pages
        createPages();

        // Handle window resize
        window.addEventListener('resize', onWindowResize);

        // Start animation loop
        animate();
    } catch (error) {
        console.warn('Three.js notebook initialization failed:', error);
        // Fallback: just use CSS notebook styles
    }
}

/**
 * Create the notebook cover
 */
function createNotebookCover() {
    const coverGeometry = new THREE.PlaneGeometry(4, 5.5);
    
    // Create cover texture
    const coverCanvas = document.createElement('canvas');
    coverCanvas.width = 512;
    coverCanvas.height = 704;
    const coverCtx = coverCanvas.getContext('2d');
    
    // Draw notebook cover design
    const gradient = coverCtx.createLinearGradient(0, 0, 0, coverCanvas.height);
    gradient.addColorStop(0, '#8B4513'); // Dark brown
    gradient.addColorStop(0.5, '#A0522D'); // Saddle brown
    gradient.addColorStop(1, '#654321'); // Darker brown
    
    coverCtx.fillStyle = gradient;
    coverCtx.fillRect(0, 0, coverCanvas.width, coverCanvas.height);
    
    // Add title
    coverCtx.fillStyle = '#FFD700';
    coverCtx.font = 'bold 60px Georgia, serif';
    coverCtx.textAlign = 'center';
    coverCtx.fillText('PLANNER', coverCanvas.width / 2, coverCanvas.height / 2 - 30);
    coverCtx.font = 'bold 40px Georgia, serif';
    coverCtx.fillText('WINTER', coverCanvas.width / 2, coverCanvas.height / 2 + 30);
    
    // Add decorative lines
    coverCtx.strokeStyle = '#654321';
    coverCtx.lineWidth = 2;
    coverCtx.beginPath();
    coverCtx.moveTo(50, 100);
    coverCtx.lineTo(coverCanvas.width - 50, 100);
    coverCtx.moveTo(50, coverCanvas.height - 100);
    coverCtx.lineTo(coverCanvas.width - 50, coverCanvas.height - 100);
    coverCtx.stroke();

    const coverTexture = new THREE.CanvasTexture(coverCanvas);
    const coverMaterial = new THREE.MeshBasicMaterial({ map: coverTexture });
    
    notebookCover = new THREE.Mesh(coverGeometry, coverMaterial);
    notebookCover.position.set(-2.2, 0, 0);
    notebookCover.rotation.y = -0.3;
    scene.add(notebookCover);
}

/**
 * Create notebook pages
 */
function createPages() {
    const pageGeometry = new THREE.PlaneGeometry(4, 5.5);
    
    // Create page texture (paper-like)
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = 512;
    pageCanvas.height = 704;
    const pageCtx = pageCanvas.getContext('2d');
    
    // Paper color with texture
    pageCtx.fillStyle = '#FEFEFE';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    
    // Add subtle paper texture
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * pageCanvas.width;
        const y = Math.random() * pageCanvas.height;
        const alpha = Math.random() * 0.1;
        pageCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        pageCtx.fillRect(x, y, 1, 1);
    }
    
    // Add margin lines
    pageCtx.strokeStyle = '#E0E0E0';
    pageCtx.lineWidth = 1;
    pageCtx.beginPath();
    pageCtx.moveTo(60, 0);
    pageCtx.lineTo(60, pageCanvas.height);
    pageCtx.stroke();
    
    const pageTexture = new THREE.CanvasTexture(pageCanvas);
    
    // Create pages for each tab
    const tabOrder = ['home', 'tasks', 'calendar', 'settings'];
    
    tabOrder.forEach((tabName, index) => {
        const pageMaterial = new THREE.MeshBasicMaterial({ 
            map: pageTexture.clone(),
            side: THREE.DoubleSide
        });
        
        const page = new THREE.Mesh(pageGeometry, pageMaterial);
        page.position.set(0, 0, -index * 0.01);
        page.userData = { tabName, index };
        
        if (index === 0) {
            page.rotation.y = 0;
            currentPage = page;
        } else {
            page.rotation.y = Math.PI; // Start flipped
        }
        
        pages[tabName] = page;
        scene.add(page);
    });
}

/**
 * Flip to a specific page/tab
 */
export function flipToPage(tabName) {
    if (isAnimating || tabName === currentTab) return;
    
    isAnimating = true;
    const targetPage = pages[tabName];
    const oldPage = currentPage;
    
    if (!targetPage || !oldPage) {
        isAnimating = false;
        return;
    }
    
    // Animate page flip
    const startRotation = oldPage.rotation.y;
    const endRotation = oldPage.userData.index < targetPage.userData.index 
        ? Math.PI 
        : 0;
    
    const startTime = Date.now();
    const duration = 800; // milliseconds
    
    function animateFlip() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        oldPage.rotation.y = startRotation + (endRotation - startRotation) * eased;
        
        // Add slight lift effect
        oldPage.position.z = -Math.sin(eased * Math.PI) * 0.1;
        
        if (progress < 1) {
            requestAnimationFrame(animateFlip);
        } else {
            // Reset position
            oldPage.position.z = -oldPage.userData.index * 0.01;
            
            // Show new page
            targetPage.rotation.y = 0;
            currentPage = targetPage;
            currentTab = tabName;
            isAnimating = false;
        }
    }
    
    animateFlip();
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('notebook-container');
    if (!container || !camera || !renderer) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Add subtle cover animation
    if (notebookCover) {
        notebookCover.rotation.y = -0.3 + Math.sin(Date.now() * 0.0005) * 0.05;
    }
    
    renderer.render(scene, camera);
}

/**
 * Cleanup
 */
export function disposeNotebook() {
    if (renderer) {
        renderer.dispose();
    }
    window.removeEventListener('resize', onWindowResize);
}

