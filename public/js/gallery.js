// Select DOM elements for carousel
const galleryOpacity = document.getElementById('galleryOpacity'); // overlay container
const carouselImage = document.getElementById('carousel-image');  // image viewer
const galleryImgs = document.querySelectorAll('.galleryImg');     // all gallery thumbnails
const nextBtn = document.getElementById('slide-arrow-next');      // next button
const prevBtn = document.getElementById('slide-arrow-prev');      // previous button
const closeImgOpacity = document.getElementById('closeImgOpacity');

closeImgOpacity.addEventListener('click', ()=>{
    galleryOpacity.classList.remove('active');
})

// Track which image is currently shown
let currentIndex = 0;

// Cache for already preloaded images
const preloaded = new Set();

// Utility to preload an image only once
function smartPreload(src) {
  if (!preloaded.has(src)) {
    const img = new Image();
    img.src = src;
    preloaded.add(src);
  }
}

// Apply fade-in transition by toggling class
function fadeIn(element) {
  element.classList.remove('fade-in');          // reset class
  void element.offsetWidth;                     // trigger reflow
  element.classList.add('fade-in');             // apply transition
}

// Show carousel overlay with selected image
function openCarousel(index) {
  currentIndex = index;
  carouselImage.src = galleryImgs[index].src;
  fadeIn(carouselImage);                        // smooth fade-in
  galleryOpacity.classList.add('active');       // show overlay

  // Preload next and previous images for fast swiping
  const nextIndex = (index + 1) % galleryImgs.length;
  const prevIndex = (index - 1 + galleryImgs.length) % galleryImgs.length;

  smartPreload(galleryImgs[nextIndex].src);
  smartPreload(galleryImgs[prevIndex].src);
}

// Add click listeners to each thumbnail
galleryImgs.forEach((img, index) => {
  img.addEventListener('click', () => openCarousel(index));
});

// Next / Previous navigation
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % galleryImgs.length;
  carouselImage.src = galleryImgs[currentIndex].src;
  fadeIn(carouselImage);
});

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + galleryImgs.length) % galleryImgs.length;
  carouselImage.src = galleryImgs[currentIndex].src;
  fadeIn(carouselImage);
});

// Swipe gesture support for mobile
let startX = 0;

carouselImage.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
}, { passive: true }); // passive for smooth scroll

carouselImage.addEventListener('touchend', (e) => {
  const endX = e.changedTouches[0].clientX;
  const deltaX = endX - startX;

  if (Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      // Swipe right ➤ show previous
      currentIndex = (currentIndex - 1 + galleryImgs.length) % galleryImgs.length;
    } else {
      // Swipe left ➤ show next
      currentIndex = (currentIndex + 1) % galleryImgs.length;
    }
    carouselImage.src = galleryImgs[currentIndex].src;
    fadeIn(carouselImage);
  }
}, { passive: true }); // passive again for responsiveness
