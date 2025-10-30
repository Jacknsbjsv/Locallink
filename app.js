// --- Global Constants and API Setup ---
const API_KEY = ""; // Keep as empty string
const VOICE_NAME = "Despina"; // Smooth voice for storytelling

// --- Firebase Initialization Variables ---
let db = null;
let userId = null; // Set to a static value upon initialization
let currentArtisan = null;
let artisansCache = [];
const mainContent = document.getElementById('main-content');


// --- Utility Functions ---

/** Custom Message Box (Replaces alert/confirm) */
const showMessage = (text, type = 'success') => {
    const container = document.getElementById('message-container');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    const element = document.createElement('div');
    element.className = `${colors[type]} text-white p-4 rounded-lg shadow-xl mb-3 transform transition-transform duration-300 ease-out translate-x-full`;
    element.textContent = text;
    container.appendChild(element);

    // Animate in
    setTimeout(() => {
        element.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        element.style.transform = 'translateX(150%)';
        element.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(element);
        }, 400);
    }, 3500);
};


// --- Firebase Initialization and Auth (Simplified) ---

const initializeFirebase = async () => {
    try {
        // Load Firebase configuration
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        // Check if Firebase SDK and config are available
        if (!Object.keys(firebaseConfig).length || !window.firebase) {
            console.error("Firebase SDK or config missing. Using local guest ID.");
            userId = 'anonymous-onboarder'; 
            router('landing');
            return;
        }

        const { initializeApp, getFirestore } = window.firebase;

        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        userId = 'anonymous-onboarder'; 
        console.log(`User ID set: ${userId}`);

        listenToArtisanUpdates();

    } catch (e) {
        console.error("Critical Firebase setup error:", e);
        userId = 'fallback-guest-anonymous';
        router('landing');
    }
};

/** Listens for real-time updates to the artisans collection. */
const listenToArtisanUpdates = () => {
    if (!db || !window.firebase) { return; }
    
    const { collection, onSnapshot, query } = window.firebase;
    const artisansCollection = collection(db, 'artisans');
    const q = query(artisansCollection);

    onSnapshot(q, (snapshot) => {
        artisansCache = [];
        snapshot.forEach((doc) => {
            artisansCache.push({ id: doc.id, ...doc.data() });
        });
        console.log("Artisans cache updated. Total:", artisansCache.length);

        const currentView = window.location.hash.substring(1) || 'landing';
        if (currentView === 'browse') {
            renderBrowseView();
        }
    }, (error) => {
        console.error("Error listening to artisan collection: ", error);
        showMessage("Could not connect to database updates.", 'error');
    });
};


// --- Router and View Rendering ---

/** Navigates between application views and updates the URL hash. */
const router = (view, data = null) => {
    currentArtisan = null;
    if (view === 'detail' && data) {
        currentArtisan = data;
        window.location.hash = `#detail-${data.id}`;
    } else {
        window.location.hash = `#${view}`;
    }
    
    const currentView = view;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => link.classList.remove('text-indigo-600', 'font-bold'));

    mainContent.innerHTML = '';
    switch (currentView) {
        case 'landing':
            renderLandingView();
            break;
        case 'browse':
            renderBrowseView();
            break;
        case 'detail':
            renderArtisanDetailView(currentArtisan);
            break;
        case 'onboard':
            renderOnboardView();
            break;
        default:
            renderLandingView();
    }
};

// --- View Definitions ---

// Page 1: Landing
const renderLandingView = () => {
    mainContent.innerHTML = `
        <div class="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
            <div class="text-center max-w-4xl py-20">
                <h1 class="text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    LocalLink: Empowering Indian Artisans.
                </h1>
                <p class="text-xl text-gray-600 mb-10">
                    Bridging the gap between traditional craft and the digital customer through authentic stories and voice. Discover the heart and soul behind every creation.
                </p>
                <div class="flex justify-center space-x-6">
                    <button id="cta-browse" class="px-8 py-4 bg-indigo-600 text-white text-xl font-bold rounded-xl shadow-xl hover-lift transition duration-300">
                        Discover Artisans
                    </button>
                    <button id="cta-onboard" class="px-8 py-4 bg-white text-indigo-600 text-xl font-bold rounded-xl border-2 border-indigo-600 shadow-xl hover-lift transition duration-300">
                        Onboard New Artisan
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('cta-browse').onclick = () => router('browse');
    document.getElementById('cta-onboard').onclick = () => router('onboard'); 
};


// Page 2: Browse Artisans
const renderBrowseView = () => {
    document.getElementById('nav-artisans').classList.add('text-indigo-600', 'font-bold');

    mainContent.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">All VocalLink Artisans (${artisansCache.length})</h2>
        <div id="artisan-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            ${artisansCache.map(artisan => `
                <div class="bg-white rounded-xl overflow-hidden shadow-lg card-shadow hover-lift transition duration-300 cursor-pointer" data-id="${artisan.id}">
                    <img src="${artisan.photoUrl}" alt="${artisan.name}'s Photo" class="w-full h-48 object-cover">
                    <div class="p-5">
                        <h3 class="text-xl font-bold text-gray-900">${artisan.name}</h3>
                        <p class="text-indigo-600 font-semibold mb-3">${artisan.craft}</p>
                        <p class="text-gray-600 text-sm line-clamp-3">${artisan.story}</p>
                        <button class="mt-4 text-indigo-600 font-medium hover:text-indigo-800 transition duration-150">View Story →</button>
                    </div>
                </div>
            `).join('')}
        </div>
        ${artisansCache.length === 0 ? '<p class="text-lg text-gray-500 mt-10 text-center">No artisans have been onboarded yet. Be the first!</p>' : ''}
    `;

    document.querySelectorAll('#artisan-list div[data-id]').forEach(card => {
        card.onclick = () => {
            const artisanId = card.getAttribute('data-id');
            const artisan = artisansCache.find(a => a.id === artisanId);
            if (artisan) {
                router('detail', artisan);
            }
        };
    });
};

// Page 3: Artisan Detail (Story Profile)
const renderArtisanDetailView = (artisan) => {
    if (!artisan) {
        showMessage("Artisan not found.", 'error');
        router('browse');
        return;
    }
    
    // Create a Google Maps URL for the location, if available
    const mapsLink = artisan.location ? 
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(artisan.location)}` : 
        '#';

    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden mt-8">
            <div class="relative">
                <img src="${artisan.photoUrl}" alt="${artisan.name}'s Photo" class="w-full h-96 object-cover object-top">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h2 class="text-5xl font-extrabold text-white">${artisan.name}</h2>
                    <p class="text-2xl text-indigo-300">${artisan.craft} Artisan</p>
                </div>
            </div>
            
            <div class="p-8">
                <h3 class="text-3xl font-bold text-indigo-600 mb-4 border-b pb-2">The Story of ${artisan.name}</h3>
                <p class="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">${artisan.story}</p>
                
                <div class="mt-8 pt-6 border-t">
                    <h4 class="text-2xl font-bold text-gray-800 mb-4">Contact & Location</h4>
                    <div class="flex flex-col space-y-3">
                        <div class="text-lg text-gray-700">
                            <span class="font-semibold text-gray-800">📍 Location:</span> 
                            ${artisan.location ? 
                                `<a href="${mapsLink}" target="_blank" class="text-blue-600 hover:underline">${artisan.location} (Get Directions)</a>` : 
                                'N/A'}
                        </div>
                        <div class="text-lg text-gray-700">
                            <span class="font-semibold text-gray-800">📞 Phone:</span> 
                            <a href="tel:${artisan.contactNumber}" class="text-blue-600 hover:underline">${artisan.contactNumber || 'N/A'}</a>
                        </div>
                        <div class="text-lg text-gray-700">
                            <span class="font-semibold text-gray-800">✉️ Email:</span> 
                            <a href="mailto:${artisan.email}" class="text-blue-600 hover:underline">${artisan.email || 'N/A'}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};


// Page 5: Onboard View (Artisan Form)
const renderOnboardView = () => {
    document.getElementById('nav-onboard').classList.add('bg-indigo-700'); 

    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto p-6 bg-white shadow-2xl rounded-xl mt-8">
            <h2 class="text-3xl font-bold text-indigo-700 mb-6 border-b pb-2">
                Onboard a New Artisan Profile
            </h2>
            <p class="text-md text-gray-600 mb-6">
                Fill this form to instantly create a new **LocalLink Story-Profile** for an artisan, making them discoverable to the world.
            </p>

            <form id="artisan-form" class="space-y-6">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="artisan-name" class="block text-sm font-medium text-gray-700 mb-1">Artisan's Name <span class="text-red-500">*</span></label>
                        <input type="text" id="artisan-name" required class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150">
                    </div>
                    <div>
                        <label for="artisan-craft" class="block text-sm font-medium text-gray-700 mb-1">Craft/Art Form <span class="text-red-500">*</span></label>
                        <input type="text" id="artisan-craft" required class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150">
                    </div>

                    <div>
                        <label for="artisan-contact" class="block text-sm font-medium text-gray-700 mb-1">Contact Number <span class="text-red-500">*</span></label>
                        <input type="tel" id="artisan-contact" required placeholder="e.g., +919876543210" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150">
                    </div>
                    <div>
                        <label for="artisan-email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" id="artisan-email" placeholder="Optional" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150">
                    </div>
                </div>

                <div class="md:col-span-2">
                    <label for="artisan-location" class="block text-sm font-medium text-gray-700 mb-1">Artisan Shop Address/Location <span class="text-red-500">*</span></label>
                    <input type="text" id="artisan-location" required placeholder="Full address or major landmark (e.g., Shop 4, Near Gandhi Chowk, Jaipur)" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150">
                </div>
                
                <div class="space-y-4 p-5 rounded-lg story-generator-section">
                    <h3 class="text-xl font-semibold text-indigo-700">
                        Artisan Story
                    </h3>
                    <label for="artisan-story" class="block text-sm font-medium text-gray-700 mb-1">Final Story <span class="text-red-500">*</span></label>
                    <textarea id="artisan-story" required rows="6" placeholder="Write the artisan's compelling story here (max 150 words)." class="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none transition duration-150"></textarea>
                </div>

                <button type="submit" id="submit-artisan-btn" class="w-full bg-green-500 text-white py-3 rounded-lg text-xl font-bold hover:bg-green-600 transition disabled:bg-green-300 shadow-xl">
                    Submit Artisan Profile
                </button>
            </form>
        </div>
    `;
    
    document.getElementById('artisan-form').onsubmit = (e) => {
        e.preventDefault();
        handleSubmitArtisan();
    };
};

// --- Form Submission Handlers ---

/** Handles the submission of the artisan onboarding form. */
const handleSubmitArtisan = async () => {
    const submitBtn = document.getElementById('submit-artisan-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    if (!db || !userId) {
        showMessage("System initialization pending. Cannot submit.", 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Artisan Profile';
        return;
    }

    const name = document.getElementById('artisan-name').value.trim();
    const craft = document.getElementById('artisan-craft').value.trim();
    const contactNumber = document.getElementById('artisan-contact').value.trim();
    const email = document.getElementById('artisan-email').value.trim();
    // NEW FIELD
    const location = document.getElementById('artisan-location').value.trim();
    const story = document.getElementById('artisan-story').value.trim();

    if (!name || !craft || !contactNumber || !location || !story) { // Updated required fields
        showMessage("Please fill all required fields (Name, Craft, Contact, Location, Story).", 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Artisan Profile';
        return;
    }
    
    try {
        const { collection, addDoc } = window.firebase;
        const docRef = await addDoc(collection(db, 'artisans'), {
            name,
            craft,
            story,
            contactNumber, 
            email, 
            location, // NEW: Location field saved to database
            addedBy: userId, 
            addedAt: new Date().toISOString(),
            isVerified: true, 
            photoUrl: `https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(name.split(' ')[0])}+Artisan`, 
        });

        showMessage(`Artisan "${name}" onboarded successfully!`, 'success');

        // Clear form
        document.getElementById('artisan-form').reset();
        document.getElementById('artisan-story').value = '';
        router('browse'); 
    } catch (error) {
        console.error("Error adding document: ", error);
        showMessage(`Failed to submit artisan: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Artisan Profile';
    }
};


// --- Initialization and Event Listeners ---

window.onload = () => {
    initializeFirebase();

    router(window.location.hash.substring(1) || 'landing'); 

    document.getElementById('nav-home').onclick = () => router('landing');
    document.getElementById('nav-artisans').onclick = () => router('browse');
    document.getElementById('nav-onboard').onclick = () => router('onboard'); 
};