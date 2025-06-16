// --- Supabase Setup ---
// Use the globally available supabase client from index.html
const supabase = window.supabaseClient || window.supabase?.createClient(
  'https://ojeyqqzpmhapnwwupely.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZXlxcXpwbWhhcG53d3VwZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDkwMDYsImV4cCI6MjA2MzEyNTAwNn0.8KrxB1P76kTtdaPxH8fINqCa6oB6xzA_BesvXpxsCF4'
);

// Consolidated State
const state = {
  currentSound: null,
  isPlaying: false,
  isMixMode: false,
  mixAudios: {},
  mixVolumes: {},
  hideUI: localStorage.getItem('hideUI') === 'true',
  useSoundBackground: true,
  customBackground: null,
  timer: {
    mode: 'focus',
    timerType: 'pomodoro', // pomodoro, simple, endless
    timeLeft: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    isRunning: false,
    isEditing: false,
    timer: null,
    elapsedTime: 0, // For endless timer
    pomodoroCycles: parseInt(localStorage.getItem('pomodoroCycles'), 10) || 4,
    currentCycle: parseInt(localStorage.getItem('pomodoroCurrentCycle'), 10) || 1,
    longBreakDuration: parseInt(localStorage.getItem('pomodoroLongBreakDuration'), 10) || 15 * 60
  }
};

// --- User State ---
let user = null;
let userProfile = null;
let isPlusUser = false;

async function fetchUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user || null;
  if (user) {
    // Fetch profile from 'profiles' table (must have 'plus' boolean column)
    const { data, error } = await supabase
      .from('profiles')
      .select('plus')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      userProfile = data;
      isPlusUser = !!data.plus;
    } else {
      isPlusUser = false;
    }
  } else {
    isPlusUser = false;
  }
}

console.log('main.js loaded');
// Simple Sound Player
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired.'); // Check if this logs
    const appElement = document.getElementById('app');
    console.log('App element found:', appElement);

    // Preload images
    function preloadImages() {
        const imagesToPreload = [
            "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
            "https://i.pinimg.com/originals/c5/4e/8f/c54e8f5b82a0b0c6ff9d8ccb3f5d66fe.gif"
        ];

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Call preload function
    preloadImages();

    
    // Audio element
    let audio = new Audio();
    audio.loop = true;


    // Fallback sounds (original sounds)
    const fallbackSounds = [
          {
            id: "white-noise",
            name: "White Noise",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/focus/white-noise.mp3",
            imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            category: "Focus",
            tags: ["featured"]
          },
          {
            id: "brown-noise",
            name: "Brown Noise",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/focus/brown-noise.mp3",
            imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            category: "Focus",
            tags: ["featured"]
          },
          {
            id: "heavy-rain",
            name: "Heavy Rain",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/heavy-rain.mp3",
            imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            category: "Nature",
            tags: ["featured"]
          },
          {
            id: "light-rain",
            name: "Light Rain",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/light-rain.mp3",
            imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
            category: "Nature",
            tags: ["featured"]
          },
          {
            id: "coffee-shop",
            name: "Coffee Shop",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/ambient/coffee-shop.mp3",
            imageUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
            category: "Ambient",
            tags: ["featured"]
          },
          {
            id: "fireplace",
            name: "Fireplace",
            url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/ambient/fireplace.mp3",
            imageUrl: "https://i.pinimg.com/originals/c5/4e/8f/c54e8f5b82a0b0c6ff9d8ccb3f5d66fe.gif",
            thumbnailUrl: "https://i.pinimg.com/originals/c5/4e/8f/c54e8f5b82a0b0c6ff9d8ccb3f5d66fe.gif",
            category: "Ambient",
            tags: ["featured"]
          },
          {
        id: "traffic",
        name: "Traffic",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/traffic.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Urban",
        tags: ["featured"]
      },
      {
        id: "road",
        name: "Road",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/road.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "highway",
        name: "Highway",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/highway.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "fireworks",
        name: "Fireworks",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/fireworks.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Urban",
        tags: ["featured"]
      },
      {
        id: "crowd",
        name: "Crowd",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/crowd.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "street",
        name: "Street",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/busy-street.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "ambulance-siren",
        name: "Ambulance Siren",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/urban/ambulance-siren.mp3",
        imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=100&q=80",
        category: "Urban"
      },
      {
        id: "train",
        name: "Train",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/train.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=100&q=80",
        category: "Transport",
        tags: ["featured"]
      },
      {
        id: "submarine",
        name: "Submarine",
        url: "https://github.com/lofidot/moodist/blob/main/public/sounds/transport/submarine.mp3",
        imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "sailboat",
        name: "Sailboat",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/sailboat.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "rowing-boat",
        name: "Rowing Boat",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/rowing-boat.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "inside-a-train",
        name: "Inside a train",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/inside-a-train.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "airplane",
        name: "Airplane",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/transport/airplane.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Transport"
      },
      {
        id: "windshield-wipers",
        name: "Windshield Wipers",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/windshield-wipers.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "wind-chimes",
        name: "Wind Chimes",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/wind-chimes.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "washing-machine",
        name: "Washing Machine",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/washing-machine.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "vinyl-effect",
        name: "Vinyal Effect",
        url: "https://github.com/lofidot/moodist/blob/main/public/sounds/things/vinyl-effect.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "tuning-radio",
        name: "Tuning Radio",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/tuning-radio.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "slide-projector",
        name: "Slide projectors",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/slide-projector.mp3",
        imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "singing-bowl",
        name: "Singing Bowl",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/singing-bowl.mp3",
        imageUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "paper",
        name: "Paper",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/paper.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "keyboard",
        name: "Keyboard",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/things/keyboard.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Things"
      },
      {
        id: "rain-on-leaves",
        name: "Rain on leaves",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-leaves.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-tent",
        name: "Rain on tent",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-tent.mp3",
        imageUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-umbrella",
        name: "Rain on umbrella",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-umbrella.mp3",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80",
        category: "Rain"
      },
      {
        id: "rain-on-window",
        name: "Rain on window",
        url: "https://cdn.jsdelivr.net/gh/lofidot/moodist@main/public/sounds/rain/rain-on-window.mp3",
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80",
        category: "Rain",
        tags: ["featured"]
      }
    ];

    // Fallback themes (original themes)
    const fallbackThemes = [
      {
        id: "rain",
        name: "Rain",
        imageUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif",
        thumbnailUrl: "https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif"
      },
      {
        id: "forest",
        name: "Forest",
        imageUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif",
        thumbnailUrl: "https://i.pinimg.com/originals/e5/18/e8/e518e8a24b9c04a887bd4432289a5e88.gif"
      },
      {
        id: "sea",
        name: "Sea",
        imageUrl: "https://cdn.pixabay.com/video/2025/04/29/275633_large.mp4",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/img@main/Sea%20Wave%20Beach%20Frame.png"
      },
      {
        id: "cropfield",
        name: "Cropfield",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-158827.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-158827.jpg"
      },
      {
        id: "seathunder",
        name: "Seathunder",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-rpnickson-2775196.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-rpnickson-2775196.jpg"
      },
      {
        id: "grassfield",
        name: "Grassfield",
        imageUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-259280.jpg",
        thumbnailUrl: "https://cdn.jsdelivr.net/gh/lofidot/webflowwwwww@main/pexels-pixabay-259280.jpg"
      }
    ];

    // --- Fetch Sounds from Supabase ---
    async function getSoundsFromSupabase() {
      console.log('Fetching sounds from Supabase...');
      
      const { data, error } = await supabase
        .from('sounds')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sounds from Supabase:', error);
        console.log('Falling back to fallback sounds due to error');
        return fallbackSounds;
      }
      
      // Validate data structure
      if (!data || data.length === 0) {
        console.warn('No sounds found in Supabase, using fallback sounds');
        return fallbackSounds;
      }
      
      // Validate required fields for each sound
      const validatedSounds = data.filter(sound => {
        if (!sound.id || !sound.name || !sound.url) {
          console.warn('Invalid sound data, missing required fields:', sound);
          return false;
        }
        return true;
      });
      
      if (validatedSounds.length === 0) {
        console.warn('No valid sounds found in Supabase data, using fallback sounds');
        return fallbackSounds;
      }
      
      console.log(`Successfully loaded ${validatedSounds.length} sounds from Supabase`);
      return validatedSounds;
    }

    // --- Fetch Images (Themes) from Supabase ---
    async function getImagesFromSupabase() {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching images from Supabase:', error);
          return fallbackThemes;
        }
      // Optionally validate data here
      return data;
    }

    // Initialize sounds
    let sounds = [];

    // Load sounds from Supabase or use fallbacks
    async function loadSounds() {
      try {
        console.log('Attempting to load sounds from Supabase...');
        sounds = await getSoundsFromSupabase();
        console.log('Loaded sounds from Supabase:', sounds.length, 'sounds');
        console.log('First few sound IDs:', sounds.slice(0, 5).map(s => s.id));
        renderSoundGrid();
        renderSoundLibrary();
      } catch (error) {
        console.error('Error initializing sounds:', error);
        console.log('Falling back to fallbackSounds...');
        sounds = fallbackSounds;
        console.log('Using fallback sounds:', sounds.length, 'sounds');
        console.log('Fallback sound IDs:', sounds.map(s => s.id));
        renderSoundGrid();
        renderSoundLibrary();
      }
    }

    // Initialize themes
    let themes = [];

    // Load themes from Supabase or use fallbacks
    async function loadThemes() {
      try {
        themes = await getImagesFromSupabase();
        renderThemeGrid();
      } catch (error) {
        console.error('Error initializing themes:', error);
        themes = fallbackThemes;
        renderThemeGrid();
      }
    }

    // DOM Elements with graceful error handling
    const getElement = (id, required = true) => {
        const element = document.getElementById(id);
        if (!element) {
            if (required) {
                console.error(`Required element with id '${id}' not found`);
            } else {
                console.warn(`Optional element with id '${id}' not found`);
            }
        }
        return element;
    };

    // Safe element getter that returns null instead of throwing
    const safeGetElement = (id) => {
        return getElement(id, false);
    };

    // Critical elements - app will show error if these are missing
    const app = getElement('app');
    if (!app) {
        console.error('Critical error: App container not found. Cannot initialize application.');
        document.body.innerHTML = '<div style="padding: 20px; color: red; text-align: center;">Error: Application container not found. Please check the HTML structure.</div>';
        return;
    }

    // Core elements with graceful fallbacks
    const backgroundOverlay = safeGetElement('background-overlay');
    const soundGrid = safeGetElement('sound-grid');
    const playButton = safeGetElement('play-btn');
    const playIcon = safeGetElement('play-icon');
    const pauseIcon = safeGetElement('pause-icon');
    const hideUIButton = safeGetElement('hide-ui-btn');
    const themeButton = safeGetElement('theme-btn');
    const themeModal = safeGetElement('theme-modal');
    const closeModalButton = safeGetElement('close-modal');
    const customBgUrlInput = safeGetElement('custom-bg-url');
    const applyBgButton = safeGetElement('apply-bg-btn');
    const fileDropZone = safeGetElement('file-drop-zone');
    const themeFileInput = safeGetElement('theme-file-input');
    const applyUploadButton = safeGetElement('apply-upload-btn');
    const soundLibraryBtn = safeGetElement('sound-library-btn');
    const soundLibrary = safeGetElement('sound-library');
    const closeLibraryBtn = safeGetElement('close-library');

    // Settings Modal elements
    const settingsModal = safeGetElement('settings-modal');
    const closeSettingsModalBtn = safeGetElement('close-settings-modal');


    // Store the original document title
    const originalTitle = document.title;

    // Functions
    function playSound() {
      if (!state.currentSound) return;
      
      try {
        // Properly cleanup previous audio to prevent memory leaks
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          // Remove all event listeners
          audio.removeEventListener('canplay', audio.canplayHandler);
          audio.removeEventListener('playing', audio.playingHandler);
          audio.removeEventListener('pause', audio.pauseHandler);
          audio.removeEventListener('error', audio.errorHandler);
          audio.src = '';
          audio.load(); // Force cleanup
        }
        
        // Create new audio instance
        audio = new Audio();
        audio.src = state.currentSound.url;
        audio.loop = true;
        
        // Set up event listeners with proper references for cleanup
        audio.canplayHandler = () => {
          console.log('Audio can play, starting playback');
        };
        
        audio.playingHandler = () => {
          console.log('Audio is now playing');
          state.isPlaying = true;
          updatePlayButton();
          updateSoundLibraryIcons();
        };
        
        audio.pauseHandler = () => {
          console.log('Audio paused');
          state.isPlaying = false;
          updatePlayButton();
          updateSoundLibraryIcons();
        };
        
        audio.errorHandler = (e) => {
          console.error('Error loading sound:', e);
          state.isPlaying = false;
          updatePlayButton();
          updateSoundLibraryIcons();
        };
        
        audio.addEventListener('canplay', audio.canplayHandler);
        audio.addEventListener('playing', audio.playingHandler);
        audio.addEventListener('pause', audio.pauseHandler);
        audio.addEventListener('error', audio.errorHandler);
        
        // Start playback
        console.log('Starting audio playback for:', state.currentSound.name);
        audio.play().then(() => {
          console.log('Audio play() promise resolved');
        }).catch(e => {
          console.error('Playback error:', e);
          state.isPlaying = false;
          updatePlayButton();
          updateSoundLibraryIcons();
        });
        
      } catch (e) {
        console.error('Sound error:', e);
        state.isPlaying = false;
        updatePlayButton();
        updateSoundLibraryIcons();
      }
    }

    
    function pauseSound() {
      if (audio) {
        audio.pause();
      }
      state.isPlaying = false;
      updatePlayButton();
      updateSoundLibraryIcons();
      if (backgroundOverlay) {
        backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      }
      if (typeof renderSoundGrid === 'function') {
        renderSoundGrid();
      }
    }
    
    // Add cleanup function for proper audio disposal
    function cleanupAudio() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        // Remove all event listeners
        if (audio.canplayHandler) audio.removeEventListener('canplay', audio.canplayHandler);
        if (audio.playingHandler) audio.removeEventListener('playing', audio.playingHandler);
        if (audio.pauseHandler) audio.removeEventListener('pause', audio.pauseHandler);
        if (audio.errorHandler) audio.removeEventListener('error', audio.errorHandler);
        audio.src = '';
        audio.load(); // Force cleanup
        audio = null;
      }
    }
    
    function updatePlayButton() {
        if (!playButton || !playIcon || !pauseIcon) {
            console.warn('Play button elements not found, skipping update');
            return;
        }
        
        if (state.isMixMode) {
            // In Mix Mode, show pause icon if any mix sound is playing
            const anyPlaying = Object.values(state.mixAudios).some(audio => audio && !audio.paused);
            playButton.classList.toggle('active', anyPlaying);
            playButton.classList.toggle('playing', anyPlaying);
            playIcon.classList.toggle('hidden', anyPlaying);
            pauseIcon.classList.toggle('hidden', !anyPlaying);
        } else {
            playButton.classList.toggle('active', state.isPlaying);
            playButton.classList.toggle('playing', state.isPlaying);
            playIcon.classList.toggle('hidden', state.isPlaying);
            pauseIcon.classList.toggle('hidden', !state.isPlaying);
        }
    }

    function updateBackground() {
        // Helper: is video URL
        function isVideoUrl(url) {
            return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
        }

        let bgUrl = null;
        if (state.useSoundBackground && state.currentSound) {
            // Handle both imageUrl (fallback) and image_url (Supabase) formats
            bgUrl = state.currentSound.image_url || state.currentSound.imageUrl;
        } else if (state.customBackground) {
            bgUrl = state.customBackground;
        }

        // Get or create video background element
        let videoBg = document.getElementById('background-video');
        
        if (bgUrl && isVideoUrl(bgUrl)) {
            if (!videoBg) {
                // Create video element if it doesn't exist
                videoBg = document.createElement('video');
                videoBg.id = 'background-video';
                videoBg.autoplay = true;
                videoBg.loop = true;
                videoBg.muted = true;
                videoBg.playsInline = true;
                videoBg.style.position = 'absolute';
                videoBg.style.top = '0';
                videoBg.style.left = '0';
                videoBg.style.width = '100%';
                videoBg.style.height = '100%';
                videoBg.style.objectFit = 'cover';
                videoBg.style.zIndex = '0';
                videoBg.style.pointerEvents = 'none';
                videoBg.style.background = 'black';
                if (backgroundOverlay) {
                    app.insertBefore(videoBg, backgroundOverlay);
                } else {
                    app.appendChild(videoBg);
                }
            }
            
            // Only update source if it's different
            if (videoBg.src !== bgUrl) {
                videoBg.src = bgUrl;
            }
            
            app.style.backgroundImage = 'none';
            app.style.backgroundSize = ''; // Clear image background styles when using video
            app.style.backgroundPosition = '';
            app.style.backgroundRepeat = '';
        } else {
            // Remove video if it exists and we're not using a video
            if (videoBg) {
                videoBg.remove();
            }
            
            if (bgUrl) {
                app.style.backgroundImage = `url(${bgUrl})`;
                // Explicitly set background size/position for images
                app.style.backgroundSize = 'cover';
                app.style.backgroundPosition = 'center';
                app.style.backgroundRepeat = 'no-repeat';
            } else {
                app.style.backgroundImage = 'none';
                app.style.backgroundSize = '';
                app.style.backgroundPosition = '';
                app.style.backgroundRepeat = '';
            }
        }

        // Update overlay opacity
        if (backgroundOverlay) {
            if (state.hideUI) {
                backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            } else {
                backgroundOverlay.style.backgroundColor = state.isPlaying ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)';
            }
        }
    }

    function toggleUIVisibility() {
        state.hideUI = !state.hideUI;
        
        // Hide/show elements
        const controlsContainer = document.querySelector('.controls-container');
        const soundGrid = document.getElementById('sound-grid');
        const timerContainer = document.querySelector('.timer-container');
        const navigationSection = document.getElementById('navigation-section');
        const navbar = document.querySelector('.navbar');
        
        if (state.hideUI) {
            // Add hide-ui class to body for CSS targeting
            document.body.classList.add('hide-ui');
            
            // Hide elements
            if (controlsContainer) controlsContainer.classList.add('hidden');
            if (soundGrid) soundGrid.classList.add('hidden');
            if (navigationSection) navigationSection.classList.add('hidden');
            if (navbar) navbar.classList.add('hidden');
            
            // Remove any existing unhide button first
            const existingUnhideBtn = document.getElementById('unhide-btn');
            if (existingUnhideBtn) existingUnhideBtn.remove();
            
            // Create and show unhide button
            const unhideButton = document.createElement('button');
            unhideButton.id = 'unhide-btn';
            unhideButton.className = 'unhide-button';
            unhideButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L22 22" stroke="currentColor" stroke-width="2"/>
                    <path d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884L6.71277 6.7226Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818" stroke="currentColor" stroke-width="2"/>
                    <path d="M15.0005 12C15.0005 12 15.0005 12.0001 15.0005 12.0001M12.0005 9C12.0005 9 12.0005 9.00006 12.0005 9.00006" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 5C16.7915 5 20.0334 8.62459 21.4938 10.7509C22.0118 11.5037 22.0118 12.4963 21.4938 13.2491C21.1159 13.8163 20.5485 14.5695 19.8071 15.3454" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
            
            // Use a separate function to avoid recursive calls
            unhideButton.addEventListener('click', showUI);
            document.body.appendChild(unhideButton);
        } else {
            // Remove hide-ui class from body
            document.body.classList.remove('hide-ui');
            
            // Show elements
            if (controlsContainer) controlsContainer.classList.remove('hidden');
            if (soundGrid) soundGrid.classList.remove('hidden');
            if (navigationSection) navigationSection.classList.remove('hidden');
            if (navbar) navbar.classList.remove('hidden');
            
            // Remove unhide button
            const existingUnhideBtn = document.getElementById('unhide-btn');
            if (existingUnhideBtn) existingUnhideBtn.remove();
        }
        
        // Don't hide timer if it's visible
        if (timerContainer && timerContainer.classList.contains('visible')) {
            timerContainer.classList.remove('hidden');
        }
        
        localStorage.setItem('hideUI', state.hideUI);
        updateBackground();
    }
    
    function showUI() {
        state.hideUI = false;
        
        // Remove hide-ui class from body
        document.body.classList.remove('hide-ui');
        
        // Show elements
        const controlsContainer = document.querySelector('.controls-container');
        const soundGrid = document.getElementById('sound-grid');
        const navigationSection = document.getElementById('navigation-section');
        const navbar = document.querySelector('.navbar');
        
        if (controlsContainer) controlsContainer.classList.remove('hidden');
        if (soundGrid) soundGrid.classList.remove('hidden');
        if (navigationSection) navigationSection.classList.remove('hidden');
        if (navbar) navbar.classList.remove('hidden');
        
        // Remove unhide button
        const existingUnhideBtn = document.getElementById('unhide-btn');
        if (existingUnhideBtn) existingUnhideBtn.remove();
        
        localStorage.setItem('hideUI', state.hideUI);
        updateBackground();
    }
    
    function handlePlayPauseClick(event) {
        event.stopPropagation(); // Prevent event bubbling
        
        if (!state.currentSound) {
            showToast('Please select a sound first', 'info');
            return;
        }
        
        if (state.isPlaying) {
            pauseSound();
        } else {
            playSound();
        }
    }

    function selectSound(sound) {
      if (!sound) {
        console.warn('selectSound called with no sound');
        return;
      }
      
      console.log('Selecting sound:', sound.name, sound.id);
      
      // If clicking the same sound that's already playing, pause it
      if (state.currentSound && state.currentSound.id === sound.id && state.isPlaying) {
        console.log('Pausing currently playing sound');
        pauseSound();
        return;
      }
      
      // Select new sound and start playing
      state.currentSound = sound;
      console.log('Set current sound to:', state.currentSound.name);
      
      if (state.useSoundBackground) {
        updateBackground();
        renderThemeGrid(); // Re-render theme grid to update Default card
      }
      
      // Always start playing when a sound is selected
      cleanupAudio();
      state.isPlaying = true;
      console.log('Starting playback of:', sound.name);
      playSound();
      
      updatePlayButton();
      renderSoundGrid();
      renderSoundLibrary();
    }

    function handleImageLoad(img) {
        img.setAttribute('loaded', 'true');
        img.style.animation = 'none';
    }

    function renderSoundGrid() {
        if (!soundGrid) {
            console.warn('Sound grid element not found, skipping render');
            return;
        }
        
        if (state.isMixMode) {
            // Mix Mode: show only currently playing mix sounds, or nothing if none
            const playingMixSoundIds = Object.keys(state.mixAudios).filter(id => state.mixAudios[id] && !state.mixAudios[id].paused);
            const gridSounds = sounds.filter(sound => playingMixSoundIds.includes(sound.id));
            // --- Efficient update ---
            const existingCards = Array.from(soundGrid.querySelectorAll('.sound-card'));
            // Remove cards for sounds no longer playing
            existingCards.forEach(card => {
                if (!playingMixSoundIds.includes(card.dataset.soundId)) {
                    card.remove();
                }
            });
            // Add or update cards for currently playing sounds
            gridSounds.forEach(sound => {
                let soundCard = soundGrid.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                if (!soundCard) {
                    soundCard = document.createElement('div');
                    soundCard.className = 'sound-card';
                    soundCard.dataset.soundId = sound.id;
                    soundCard.innerHTML = `
                        <button class="sound-button active playing" data-sound-id="${sound.id}">
                            <img loading="eager" decoding="async" src="${imageUrlToUse}" alt="${sound.name}" width="100" height="100" style="will-change: auto;">
                            <div class="sound-indicator"></div>
                        </button>
                        <span class="sound-name">${sound.name}</span>
                    `;
                    soundGrid.appendChild(soundCard);
                } else {
                    // Only update classes
                    const btn = soundCard.querySelector('.sound-button');
                    btn.classList.add('active', 'playing');
                }
            });
            // If no sounds, clear grid
            if (gridSounds.length === 0) {
                soundGrid.innerHTML = '';
            }
            return;
        }
        // Normal Mode: 4 featured sounds (2 left, 2 right), center is current sound if playing
        let featuredSounds = sounds.filter(sound => sound.category === 'Featured');
        let gridSounds = [];
        const maxGrid = 4;
        const currentSound = state.currentSound;
        if (currentSound && state.isPlaying) {
            // Center current sound, 2 featured left, 2 right
                let before = featuredSounds.slice(0, 2);
                let after = featuredSounds.slice(2, 4);
                gridSounds = [...before, currentSound, ...after];
        } else {
            // Just 4 featured sounds
            gridSounds = featuredSounds.slice(0, maxGrid);
        }
        // --- Efficient update ---
        const existingCards = Array.from(soundGrid.querySelectorAll('.sound-card'));
        // Remove cards for sounds no longer in grid
        existingCards.forEach(card => {
            if (!gridSounds.some(s => s.id === card.dataset.soundId)) {
                card.remove();
            }
        });
        // Add or update cards for grid sounds
            gridSounds.forEach(sound => {
            let soundCard = soundGrid.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
            const isActive = state.currentSound && state.currentSound.id === sound.id && state.isPlaying;
                const isCurrentlyPlaying = isActive && state.isPlaying;
            const imageUrlToUse = sound.thumbnail_url || sound.image_url;
            const isLocked = sound.plus_only && !isPlusUser;
            if (!soundCard) {
                soundCard = document.createElement('div');
                soundCard.className = 'sound-card';
                soundCard.dataset.soundId = sound.id;
                soundCard.innerHTML = `
                <button class="sound-button${isActive ? ' active' : ''}${isCurrentlyPlaying ? ' playing' : ''}" data-sound-id="${sound.id}" ${isLocked ? '' : ''}>
                    <img loading="eager" decoding="async" src="${imageUrlToUse}" alt="${sound.name}" width="100" height="100" style="will-change: auto;">
                    <div class="sound-overlay"></div>
                    <div class="sound-indicator"></div>
                    ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                    </button>
                    <span class="sound-name">${sound.name}</span>
                `;
                const soundButton = soundCard.querySelector('.sound-button');
                const img = soundButton.querySelector('img');
                img.addEventListener('load', () => handleImageLoad(img));
            if (!isLocked) {
                soundButton.addEventListener('click', () => selectSound(sound));
            } else {
                soundButton.addEventListener('click', openPlusPopup);
            }
                soundGrid.appendChild(soundCard);
            } else {
                // Only update classes
                const btn = soundCard.querySelector('.sound-button');
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('playing', isCurrentlyPlaying);
            }
            });
    }

    function closeAllBottomSheets() {
      document.querySelectorAll('.bottom-sheet').forEach(sheet => {
        sheet.classList.remove('active');
        sheet.classList.add('hidden');
      });
      document.querySelectorAll('.full-screen-modal').forEach(modal => {
        modal.classList.remove('active');
        modal.classList.add('hidden');
      });
    }

    function initializeThemeTabs() {
      const themeTabs = document.querySelectorAll('.theme-tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      themeTabs.forEach(tab => {
        tab.onclick = null;
        tab.addEventListener('click', function() {
          themeTabs.forEach(t => t.classList.remove('active'));
          tabPanes.forEach(pane => pane.classList.remove('active'));
          tab.classList.add('active');
          const tabName = tab.getAttribute('data-tab');
          const pane = document.getElementById('tab-' + tabName);
          if (pane) pane.classList.add('active');
          if (tabName === 'default') {
            state.useSoundBackground = true;
            state.customBackground = null;
            updateBackground();
            localStorage.setItem('useSoundBackground', 'true');
            localStorage.removeItem('customBackground');
            showToast('Using sound backgrounds');
            closeThemeModal();
          }
        });
        tab.onkeydown = null;
        tab.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
          }
        });
      });
    }

    async function openThemeModal() {
      if (themeModal.classList.contains('active')) {
        closeThemeModal();
        return;
      }
      closeAllBottomSheets();
      themeModal.classList.remove('hidden');
      void themeModal.offsetWidth;
      themeModal.classList.add('active');
      initializeThemeTabs();
      // Always reload themes and grid when opening modal
      await loadThemes();
    }

    function toggleSoundLibrary() {
      if (soundLibrary.classList.contains('active')) {
        soundLibrary.classList.remove('active');
        soundLibrary.classList.add('hidden');
        if (soundLibraryBtn) soundLibraryBtn.classList.remove('active');
      } else {
        closeAllBottomSheets();
        soundLibrary.classList.remove('hidden');
        void soundLibrary.offsetWidth; // Force reflow for transition
        soundLibrary.classList.add('active');
        if (soundLibraryBtn) soundLibraryBtn.classList.add('active');
      }
    }

    function closeThemeModal() {
      themeModal.classList.remove('active');
      setTimeout(() => themeModal.classList.add('hidden'), 300);
    }

    function closeSoundLibrary() {
      soundLibrary.classList.remove('active');
      soundLibrary.classList.add('hidden');
      if (soundLibraryBtn) soundLibraryBtn.classList.remove('active');
    }

    // Functions to open and close settings modal
    function openSettingsModal() {
      closeAllBottomSheets(); // Close any other open sheets/modals
      settingsModal.classList.remove('hidden');
      void settingsModal.offsetWidth; // Trigger reflow
      settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
      settingsModal.classList.remove('active');
      settingsModal.classList.add('hidden');
    }

    function setCustomBackground(url, isPreset = false) {
      // Helper function to detect video URLs
      function isVideoUrl(url) {
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
      }
      
      // Show loading state
      const loader = document.createElement('div');
      loader.className = 'background-loader';
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
      
      if (isVideoUrl(url)) {
        // Handle video URLs
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        
        video.onloadedmetadata = () => {
          // Remove loader
          loader.remove();
          
          // Store the background and call updateBackground to apply it
          localStorage.setItem('customBackground', url);
          localStorage.setItem('isPresetBackground', isPreset.toString());
          
          // Apply the video background using the existing updateBackground function
          updateBackground();
          
          showToast('Video background updated successfully', 'success');
        };
        
        video.onerror = () => {
          // Remove loader
          loader.remove();
          
          // Show error
          showToast('Failed to load video background', 'error');
          
          // Reset to default
          localStorage.removeItem('customBackground');
          localStorage.removeItem('isPresetBackground');
        };
        
        // Start loading
        video.src = url;
      } else {
        // Handle image URLs (existing logic)
        const img = new Image();
        
        img.onload = () => {
          // Remove loader
          loader.remove();
          
          // Store the background and use updateBackground to apply it properly
          state.customBackground = url;
          state.useSoundBackground = false;
          localStorage.setItem('customBackground', url);
          localStorage.setItem('isPresetBackground', isPreset.toString());
          localStorage.setItem('useSoundBackground', 'false');
          
          // Apply the background using the existing updateBackground function
          updateBackground();
          
          showToast('Background updated successfully', 'success');
        };
        
        img.onerror = () => {
          // Remove loader
          loader.remove();
          
          // Show error
          showToast('Failed to load background image', 'error');
          
          // Reset to default
          state.customBackground = null;
          state.useSoundBackground = true;
          localStorage.removeItem('customBackground');
          localStorage.removeItem('isPresetBackground');
          localStorage.setItem('useSoundBackground', 'true');
          updateBackground();
        };
        
        // Start loading
        img.src = url;
      }
    }

    // Add CSS for loader
    const backgroundLoaderStyle = document.createElement('style');
    backgroundLoaderStyle.textContent = `
      .background-loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(backgroundLoaderStyle);

    function renderSoundLibrary() {
      if (!soundLibrary) {
        console.warn('Sound library element not found, skipping render');
        return;
      }
      
      const sheetContent = soundLibrary.querySelector('.sheet-content');
      // Remove any existing mix mode switch/tabs
      const oldSwitch = document.getElementById('mix-mode-switch');
      if (oldSwitch) oldSwitch.remove();
      // Remove any existing mix-mode-switch-container from anywhere
      const oldContainer = document.querySelector('#mix-mode-switch-container');
      if (oldContainer) oldContainer.remove();
      // Get the existing mix-mode-switch-container (now in sheet-content)
      let switchContainer = document.getElementById('mix-mode-switch-container');
      if (!switchContainer) {
        // Create container in the correct location (sheet-content)
        switchContainer = document.createElement('div');
        switchContainer.id = 'mix-mode-switch-container';
        const soundHeaderFixed = soundLibrary.querySelector('.sound-header-fixed');
        if (soundHeaderFixed) {
          // Insert at the beginning of the fixed header (before close button)
          soundHeaderFixed.insertBefore(switchContainer, soundHeaderFixed.firstChild);
        } else {
          // Fallback: create sound-header-fixed if it doesn't exist
          const headerFixed = document.createElement('div');
          headerFixed.className = 'sound-header-fixed';
          headerFixed.appendChild(switchContainer);
          sheetContent.insertBefore(headerFixed, sheetContent.firstChild);
        }
      }
      // Build tab-based mode switcher markup
      switchContainer.innerHTML = `
        <div class="mix-mode-switcher">
          <button class="mix-mode-btn ${!state.isMixMode ? 'active' : ''}" data-mode="sounds">Sounds</button>
          <button class="mix-mode-btn ${state.isMixMode ? 'active' : ''}" data-mode="mix">Mix</button>
        </div>
      `;
      // Add event listeners for the tabs
      const modeBtns = switchContainer.querySelectorAll('.mix-mode-btn');
      modeBtns.forEach(btn => {
        btn.onclick = function() {
          const targetMode = this.dataset.mode;
          const shouldBeMixMode = targetMode === 'mix';
          
          if (state.isMixMode !== shouldBeMixMode) {
            if (state.isMixMode) {
              // Switching to normal mode: pause and clear all mix audios
              Object.values(state.mixAudios).forEach(audio => { if (audio) { audio.pause(); audio.currentTime = 0; } });
              state.mixAudios = {};
              state.mixVolumes = {};
            } else {
              // Switching to Mix Mode: pause and clear normal mode sound
              if (audio) { audio.pause(); audio.currentTime = 0; }
              state.currentSound = null;
              state.isPlaying = false;
            }
            state.isMixMode = shouldBeMixMode;
            renderSoundLibrary();
            renderSoundGrid();
            updatePlayButton();
            // Instantly update theme modal if open
            if (typeof themeModal !== 'undefined' && themeModal && !themeModal.classList.contains('hidden')) {
              renderThemeGrid();
            }
          }
        };
      });
      // Preserve the fixed header and clear only the content below it
      const fixedHeader = sheetContent.querySelector('.sound-header-fixed');
      sheetContent.innerHTML = '';
      if (fixedHeader) {
        sheetContent.appendChild(fixedHeader);
      }
      
      if (state.isMixMode) {
            // Mix Mode: show all sounds in a single list, no categories
            soundLibrary.classList.add('mix-mode'); // Add mix mode class
            soundLibrary.classList.remove('normal-mode-cards');
            const allSounds = sounds;
            let soundList = sheetContent.querySelector('.sound-library-list');
            if (!soundList) {
                soundList = document.createElement('div');
                soundList.className = 'sound-library-list';
                sheetContent.appendChild(soundList);
            }
            // Track which sound ids are present
            const presentIds = new Set();
            allSounds.forEach(sound => {
                const isActive = state.mixAudios[sound.id] && !state.mixAudios[sound.id].paused;
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                const isLocked = sound.plus_only && !isPlusUser;
                let item = soundList.querySelector(`.library-sound-item[data-sound-id="${sound.id}"]`);
                if (!item) {
                    // Create new item
                    const wrapper = document.createElement('div');
                    wrapper.className = 'library-sound-wrapper';
                    
                    item = document.createElement('div');
                    item.className = `library-sound-item${isActive ? ' active' : ''}`;
                    item.dataset.soundId = sound.id;
                    item.innerHTML = `
                        <img src="${imageUrlToUse}" alt="${sound.name}" class="card-image">
                        ${sound.icon ? `<div class="mix-mode-icon"><img src="${sound.icon}" alt="${sound.name} icon"></div>` : ''}
                        <div class="thumbnail-blur"></div>
                        ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                    `;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'library-sound-name';
                    nameSpan.textContent = sound.name;
                    
                    wrapper.appendChild(item);
                    wrapper.appendChild(nameSpan);
                    soundList.appendChild(wrapper);
                }
                // Update classes
                if (isActive) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
                // Slider: Add/Remove slider based on active state
                const wrapper = item.closest('.library-sound-wrapper');
                let slider = wrapper ? wrapper.querySelector('.mix-volume-slider') : null;
                if (!isLocked && isActive && !slider && wrapper) {
                    slider = document.createElement('input');
                    slider.type = 'range';
                    slider.min = '0';
                    slider.max = '100';
                    slider.value = state.mixVolumes[sound.id] !== undefined ? state.mixVolumes[sound.id] : 50;
                    slider.className = 'mix-volume-slider';
                    slider.dataset.soundId = sound.id;
                    slider.addEventListener('click', e => e.stopPropagation());
                    slider.addEventListener('input', (e) => {
                      const volume = parseInt(e.target.value, 10);
                      state.mixVolumes[sound.id] = volume;
                      if (state.mixAudios[sound.id] && typeof state.mixAudios[sound.id].volume !== 'undefined') {
                        try {
                          state.mixAudios[sound.id].volume = volume / 100;
                        } catch (error) {
                          console.error('Error setting mix audio volume:', error);
                        }
                      }
                    });
                    // Append slider to the wrapper (below the sound name)
                    wrapper.appendChild(slider);
                } else if ((!isActive || isLocked) && slider) {
                    slider.remove();
                }
                presentIds.add(sound.id);
            });
            // Remove items for sounds no longer present
            soundList.querySelectorAll('.library-sound-item').forEach(item => {
                if (!presentIds.has(item.dataset.soundId)) {
                    item.remove();
                }
            });
            // Add event listeners for all items (as before)
            const items = soundList.querySelectorAll('.library-sound-item');
            items.forEach(item => {
                const soundId = item.dataset.soundId;
                const sound = sounds.find(s => s.id === soundId);
                const isLocked = sound.plus_only && !isPlusUser;
                if (!isLocked) {
                    const wrapper = item.closest('.library-sound-wrapper');
                    const slider = wrapper ? wrapper.querySelector('.mix-volume-slider') : null;
                    // Handler to toggle play/pause
                    const playPauseHandler = (e) => {
                      e.stopPropagation();
                      try {
                        if (!state.mixAudios[soundId]) {
                          const initialVolume = state.mixVolumes[soundId] !== undefined ? state.mixVolumes[soundId] : 50;
                          const audio = new Audio(sound.url);
                          audio.loop = true;
                          audio.volume = initialVolume / 100;
                          state.mixVolumes[soundId] = initialVolume;
                          state.mixAudios[soundId] = audio;
                          
                          // Add error handling for audio loading
                          audio.onerror = (error) => {
                            console.error('Mix audio loading error:', error);
                            delete state.mixAudios[soundId];
                            delete state.mixVolumes[soundId];
                            renderSoundLibrary();
                            renderSoundGrid();
                            updatePlayButton();
                          };
                          
                          audio.play().catch(error => {
                            console.error('Mix audio playback error:', error);
                            delete state.mixAudios[soundId];
                            delete state.mixVolumes[soundId];
                            renderSoundLibrary();
                            renderSoundGrid();
                            updatePlayButton();
                          });
                        } else {
                          const audio = state.mixAudios[soundId];
                          if (audio && audio.paused) {
                            audio.play().catch(error => {
                              console.error('Mix audio resume error:', error);
                              delete state.mixAudios[soundId];
                              delete state.mixVolumes[soundId];
                            });
                          } else if (audio) {
                            audio.pause();
                            // Remove from mix state when paused (deselected)
                            delete state.mixAudios[soundId];
                            delete state.mixVolumes[soundId];
                          }
                        }
                        renderSoundLibrary();
                        renderSoundGrid();
                        updatePlayButton();
                      } catch (error) {
                        console.error('Mix mode handler error:', error);
                        // Cleanup on error
                        if (state.mixAudios[soundId]) {
                          delete state.mixAudios[soundId];
                          delete state.mixVolumes[soundId];
                        }
                        renderSoundLibrary();
                        renderSoundGrid();
                        updatePlayButton();
                      }
                    };
                    item.onclick = null;
                    item.addEventListener('click', playPauseHandler);
                    if (slider) {
                      slider.addEventListener('click', e => e.stopPropagation());
                      slider.addEventListener('input', (e) => {
                        const volume = parseInt(e.target.value, 10);
                        state.mixVolumes[soundId] = volume;
                        if (state.mixAudios[soundId] && typeof state.mixAudios[soundId].volume !== 'undefined') {
                          try {
                            state.mixAudios[soundId].volume = volume / 100;
                          } catch (error) {
                            console.error('Error setting mix audio volume:', error);
                          }
                        }
                      });
                    }
                } else {
                    item.onclick = null;
                    item.addEventListener('click', openPlusPopup);
                }
            });
        } else {
            // Normal mode code...
            soundLibrary.classList.remove('mix-mode');
            soundLibrary.classList.add('normal-mode-cards'); // Add class for card styles
            soundLibrary.classList.remove('mix-mode-list'); // Remove mix mode specific class if any
            const categories = [...new Set(sounds.map(sound => sound.category))];
      categories.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'sound-category';
        categorySection.innerHTML = `
          <h3>${category}</h3>
          <div class="sound-library-list">
            ${sounds
              .filter(sound => sound.category === category)
              .map(sound => {
                const isActive = state.currentSound && state.currentSound.id === sound.id && state.isPlaying;
                const imageUrlToUse = sound.thumbnail_url || sound.image_url;
                const isLocked = sound.plus_only && !isPlusUser;
                return `
                  <div class="library-sound-wrapper">
                    <div class="library-sound-item ${isActive ? 'active' : ''}" data-sound-id="${sound.id}">
                      <img src="${imageUrlToUse}" alt="${sound.name}" class="card-image">
                      <div class="thumbnail-blur"></div>
                      ${isLocked ? '<div class="plus-badge plus-badge-bottom">Plus</div>' : ''}
                    </div>
                    <span class="library-sound-name">${sound.name}</span>
                  </div>
                `;
              }).join('')}
          </div>
        `;
                sheetContent.appendChild(categorySection);
            });
            // Add click event listeners to sound items (fixed: no :contains())
            sheetContent.querySelectorAll('.sound-category').forEach(categorySection => {
                const header = categorySection.querySelector('h3');
                if (!header) return;
                // const category = header.textContent.trim(); // Not needed for event binding
        categorySection.querySelectorAll('.library-sound-wrapper .library-sound-item').forEach(item => {
            const soundId = item.dataset.soundId;
            const sound = sounds.find(s => s.id === soundId);
          const isLocked = sound.plus_only && !isPlusUser;
          if (!isLocked) {
            item.addEventListener('click', () => {
              selectSound(sound);
                            // Do NOT close the sound library automatically
                            // closeSoundLibrary();
            });
          } else {
            item.addEventListener('click', openPlusPopup);
            }
          });
      });
        }
    }

    function updateSoundLibraryIcons() {
      const soundItems = document.querySelectorAll('.library-sound-wrapper .library-sound-item');
      soundItems.forEach(item => {
        const soundId = item.dataset.soundId;
        const isActive = state.currentSound && state.currentSound.id === soundId && state.isPlaying;
        item.classList.toggle('active', isActive);
      });
    }

    function toggleSound(soundId) {
      const sound = sounds.find(s => s.id === soundId);
      if (!sound) return;
      const isActive = state.currentSound && state.currentSound.id === soundId && state.isPlaying;
      if (isActive) {
        pauseSound();
      } else {
        selectSound(sound);
        playSound();
      }
      updateSoundLibraryIcons();
    }

    // Add to global state
    if (!window.state) window.state = {};
    if (!('selectedThemeCategory' in state)) state.selectedThemeCategory = 'All';

    function renderThemeGrid() {
      const presetGrid = document.querySelector('.preset-grid');
      if (!presetGrid) return;
      // Find the parent .theme-section to inject the category bar above the grid
      const themeSection = presetGrid.closest('.theme-section');
      let categoryBar = themeSection.querySelector('.theme-category-bar');
      if (!categoryBar) {
        categoryBar = document.createElement('div');
        categoryBar.className = 'theme-category-bar';
        themeSection.insertBefore(categoryBar, presetGrid);
      }
      // Collect all unique categories from themes
      let allCategories = [];
      themes.forEach(theme => {
        if (Array.isArray(theme.categories)) {
          allCategories.push(...theme.categories);
        }
      });
      allCategories = Array.from(new Set(allCategories.filter(Boolean)));
      allCategories.sort();
      // Always show 'All' first
      const categories = ['All', ...allCategories];
      // Render category buttons
      categoryBar.innerHTML = categories.map(cat => `
        <button class="theme-category-btn${state.selectedThemeCategory === cat ? ' active' : ''}" data-category="${cat}">${cat}</button>
      `).join('');
      // Add click listeners
      categoryBar.querySelectorAll('.theme-category-btn').forEach(btn => {
        btn.onclick = () => {
          state.selectedThemeCategory = btn.dataset.category;
          renderThemeGrid();
        };
      });

      // Get current sound's image for Default card
      const currentSoundImage = state.currentSound ? state.currentSound.thumbnail_url : 'https://i.pinimg.com/originals/5f/a7/56/5fa756bd5a44204fc72891f265b4fd2b.gif';
      // Add Default card first
      const defaultCard = `
        <div class="preset-theme-wrapper">
          <div class="preset-theme${state.useSoundBackground ? ' active' : ''}" data-theme="default">
            <div class="preset-preview" style="background-image: url('${currentSoundImage}')"></div>
            <div class="thumbnail-blur"></div>
            <div class="theme-description">Sound's background</div>
          </div>
          <span class="theme-name">Default</span>
        </div>
      `;
      // Filter themes by selected category
      let filteredThemes = themes;
      if (state.selectedThemeCategory && state.selectedThemeCategory !== 'All') {
        filteredThemes = themes.filter(theme => Array.isArray(theme.categories) && theme.categories.includes(state.selectedThemeCategory));
      }
      // Then add the rest of the themes
      const themeCards = filteredThemes.map(theme => {
        const isActive = !state.useSoundBackground && state.customBackground === theme.url;
        const isLocked = theme.plus_only && !isPlusUser;
        return `
          <div class="preset-theme-wrapper">
            <div class="preset-theme${isActive ? ' active' : ''}" data-theme="${theme.url}">
              <img src="${theme.thumbnail_url}" alt="${theme.name}" class="card-image">
              <div class="thumbnail-blur"></div>
              ${isLocked ? '<div class="plus-badge plus-badge-top">Plus</div>' : ''}
            </div>
            <span class="theme-name">${theme.name}</span>
          </div>
        `;
      }).join('');
      // Hide default card if in mix mode
      presetGrid.innerHTML = state.isMixMode ? themeCards : defaultCard + themeCards;
      // Attach event listeners for all theme cards
      document.querySelectorAll('.preset-theme-wrapper .preset-theme').forEach(button => {
        const themeUrl = button.dataset.theme;
        // Special handling for Default card
        if (themeUrl === 'default') {
          button.addEventListener('click', () => {
            state.useSoundBackground = true;
            state.customBackground = null;
            renderThemeGrid();
            updateBackground();
            localStorage.setItem('useSoundBackground', 'true');
            localStorage.removeItem('customBackground');
            showToast('Using sound backgrounds');
          });
          return;
        }
        // Handle other theme cards
        const theme = themes.find(t => t.url === themeUrl);
        const isLocked = theme.plus_only && !isPlusUser;
        if (!isLocked) {
          button.addEventListener('click', () => {
            button.classList.add('loading');
            state.customBackground = themeUrl;
            state.useSoundBackground = false;
            renderThemeGrid();
            setCustomBackground(themeUrl, true);
            setTimeout(() => {
              button.classList.remove('loading');
            }, 3000);
          });
        } else {
          button.addEventListener('click', openPlusPopup);
        }
      });
    }

    // Theme Tab Switching Functionality
    function initializeThemeTabs() {
      const themeModeButtons = document.querySelectorAll('.theme-mode-btn');
      const customSection = document.getElementById('custom-section');
      const themesSection = document.getElementById('themes-section');
      
      if (!themeModeButtons.length || !customSection || !themesSection) {
        console.warn('Theme tab elements not found');
        return;
      }
      
      themeModeButtons.forEach(button => {
        button.addEventListener('click', () => {
          const mode = button.dataset.mode;
          
          // Update active tab
          themeModeButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Show/hide sections
          if (mode === 'custom') {
            customSection.style.display = 'block';
            themesSection.style.display = 'none';
          } else {
            customSection.style.display = 'none';
            themesSection.style.display = 'block';
          }
        });
      });
    }
    
    // Initialize theme tabs when theme modal is opened
    
    if (closeModalButton && themeModal) {
      closeModalButton.addEventListener('click', () => {
        themeModal.classList.remove('active');
        setTimeout(() => themeModal.classList.add('hidden'), 300);
      });
    }

    // Event Listeners with null safety checks
    if (playButton) {
      playButton.addEventListener('click', () => {
        if (state.isMixMode) {
          // Mix Mode: pause/resume all active mix sounds
          const anyPlaying = Object.values(state.mixAudios).some(audio => audio && !audio.paused);
          if (anyPlaying) {
            Object.values(state.mixAudios).forEach(audio => { if (audio && !audio.paused) audio.pause(); });
          } else {
            Object.values(state.mixAudios).forEach(audio => { if (audio && audio.paused) audio.play(); });
          }
          if (typeof renderSoundGrid === 'function') renderSoundGrid();
          if (typeof renderSoundLibrary === 'function') renderSoundLibrary();
          updatePlayButton();
          return;
        }
        if (!state.currentSound) {
          // Select and play the first featured sound if none is selected
          const firstFeaturedSound = sounds.find(sound => Array.isArray(sound.tags) && sound.tags.includes('featured'));
          if (firstFeaturedSound) {
            selectSound(firstFeaturedSound);
            return;
          }
          // Fallback: select the first sound in the list
          if (sounds.length > 0) {
            selectSound(sounds[0]);
            return;
          }
          console.error('No sounds available to play');
          return;
        }
        if (state.isPlaying) {
          pauseSound();
        } else {
          playSound();
        }
      });
    }
    if (hideUIButton) hideUIButton.addEventListener('click', toggleUIVisibility);
    if (themeButton) themeButton.addEventListener('click', openThemeModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeThemeModal);
    if (soundLibraryBtn) soundLibraryBtn.addEventListener('click', toggleSoundLibrary);
    if (closeLibraryBtn) closeLibraryBtn.addEventListener('click', closeSoundLibrary);

    // Settings modal event listeners
    if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeSettingsModal);

    // Handle preset theme buttons
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !themeModal.classList.contains('hidden')) {
            closeThemeModal();
        }
        if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
            closeSettingsModal();
        }
    });


  
  
  








  
  

    // Theme Modal Tab System
    const themeTabs = document.querySelectorAll('.theme-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    themeTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active from all tabs and panes
        themeTabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        // Add active to clicked tab and corresponding pane
        tab.classList.add('active');
        const tabName = tab.getAttribute('data-tab');
        const pane = document.getElementById('tab-' + tabName);
        if (pane) pane.classList.add('active');
        // If Default tab, apply sound background immediately and close modal
        if (tabName === 'default') {
          state.useSoundBackground = true;
          state.customBackground = null;
          updateBackground();
          localStorage.setItem('useSoundBackground', 'true');
          localStorage.removeItem('customBackground');
          showToast('Using sound backgrounds');
            closeThemeModal();
        }
  });
      // Keyboard accessibility
      tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tab.click();
        }
      });
    });


    // Attach event listener for custom background apply button (once)
    if (applyBgButton && customBgUrlInput) {
      applyBgButton.onclick = null;
      applyBgButton.addEventListener('click', () => {
        setCustomBackground(customBgUrlInput.value.trim());
      });
    }

    // File upload functionality
    let selectedFile = null;

    if (fileDropZone && themeFileInput && applyUploadButton) {
      // Handle click on drop zone or browse link
      fileDropZone.addEventListener('click', () => {
        themeFileInput.click();
      });

      // Handle browse link specifically
      const browseLink = fileDropZone.querySelector('.browse-link');
      if (browseLink) {
        browseLink.addEventListener('click', (e) => {
          e.stopPropagation();
          themeFileInput.click();
        });
      }

      // Handle drag and drop
      fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('drag-over');
      });

      fileDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!fileDropZone.contains(e.relatedTarget)) {
          fileDropZone.classList.remove('drag-over');
        }
      });

      fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleFileSelection(files[0]);
        }
      });

      // Handle file input change
      themeFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileSelection(e.target.files[0]);
        }
      });

      // Handle apply upload button
      applyUploadButton.addEventListener('click', () => {
        if (selectedFile) {
          applyUploadedTheme();
        }
      });
    }

    function handleFileSelection(file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, WEBP, HEIC)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      selectedFile = file;
      
      // Update UI to show selected file
      const dropText = fileDropZone.querySelector('.drop-text');
      if (dropText) {
        dropText.innerHTML = `Selected: <span style="color: #1d69ff">${file.name}</span>`;
      }
      
      // Enable apply button
      applyUploadButton.disabled = false;
    }

    function applyUploadedTheme() {
      if (!selectedFile) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setCustomBackground(imageUrl);
        
        // Reset UI
        resetFileUploadUI();
        
        // Show success message
        showToast('Custom theme applied successfully!');
      };
      reader.readAsDataURL(selectedFile);
    }

    function resetFileUploadUI() {
      selectedFile = null;
      themeFileInput.value = '';
      applyUploadButton.disabled = true;
      
      const dropText = fileDropZone.querySelector('.drop-text');
      if (dropText) {
        dropText.innerHTML = 'Drop file here or <span class="browse-link">browse</span>';
      }
    }

    // Ensure the sound grid is rendered
    loadSounds();

    // On page load, restore cached theme if present
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        state.customBackground = savedTheme;
        state.useSoundBackground = false;
        updateBackground();
    }

    // --- Goal Placeholder Logic ---
    const goalDiv = document.getElementById('current-goal');
    const placeholder = 'Goal for This Session?';

    if (goalDiv) {
      goalDiv.addEventListener('focus', function() {
        if (goalDiv.textContent.trim() === placeholder) {
          goalDiv.textContent = '';
          goalDiv.style.color = '#fff'; // Normal text color (white)
        }
      });

      goalDiv.addEventListener('blur', function() {
        if (goalDiv.textContent.trim() === '') {
          goalDiv.textContent = placeholder;
          goalDiv.style.color = '#bdbdbd'; // Placeholder color
        }
      });

      // Handle Enter key to set goal instead of new line
      goalDiv.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          goalDiv.blur(); // Triggers blur event to "set" the goal
        }
      });

      // On page load, set color based on content
      if (goalDiv.textContent.trim() === placeholder) {
        goalDiv.style.color = '#bdbdbd';
      } else {
        goalDiv.style.color = '#fff';
      }
    }

    // On page load, fetch user profile and then load sounds/themes
    (async function initApp() {
      await fetchUserProfile();
      await loadSounds();
      await loadThemes();
      
      // Initialize statistics
      if (typeof initializeStatistics === 'function') {
        initializeStatistics();
      }
      
      // Initialize timer and insights
      if (typeof initializeTimerAndInsights === 'function') {
        initializeTimerAndInsights();
      }
    })();

    // Add minimal CSS for Plus badge (rectangle at bottom center)
    const style = document.createElement('style');
    style.innerHTML = `
    .plus-badge {
      position: absolute;
      right: -16px;
      transform: translateX(-50%);
      background: #fffffff0;
      color: #00000070;
      border-radius: 6px;
      padding: 2px 10px;
      font-size: 0.85em;
      font-weight: 700;
      z-index: 2; top: 8px;
      pointer-events: none;
    }
    .plus-badge-bottom {
      top: 8px;
    }
    .sound-button, .library-sound-thumbnail, .preset-preview {
      position: relative;
    }
    .plus-badge-top {
      top: 8px;
      bottom: auto;
    }
    `;
    document.head.appendChild(style);

    // Add link to account page in settings modal
    const settingsModalContent = document.querySelector('#settings-modal .modal-content');
    if (settingsModalContent) {
      const accountLink = document.createElement('a');
      accountLink.href = 'account.html';
      accountLink.className = 'primary-btn';
      accountLink.style.marginTop = '24px';
      accountLink.style.display = 'inline-block';
      accountLink.textContent = 'Manage Account';
      settingsModalContent.appendChild(accountLink);
    }

    // --- Plus Popup Functions for Webflow ---
    function openPlusPopup() {
      // You can use this to show your Webflow popup
      const popup = document.querySelector('.plus-popup');
      if (popup) popup.classList.add('plus-popup-open');
    }
    function closePlusPopup() {
      const popup = document.querySelector('.plus-popup');
      if (popup) popup.classList.remove('plus-popup-open');
    }
    // You can use <button id="close-plus-popup"> in your Webflow popup to call closePlusPopup()

    // Mix Mode Toggle Handler
    const mixModeToggle = document.getElementById('mix-mode-toggle');
    const mixModeLabel = document.getElementById('mix-mode-label');
    if (mixModeToggle) {
      mixModeToggle.addEventListener('click', () => {
        if (!state.isMixMode) {
          // Switching to Mix Mode: pause and clear normal mode sound
          if (audio) { audio.pause(); audio.currentTime = 0; }
          state.currentSound = null;
          state.isPlaying = false;
        } else {
          // Switching to normal mode: pause and clear all mix audios
          Object.values(state.mixAudios).forEach(audio => { if (audio) { audio.pause(); audio.currentTime = 0; } });
          state.mixAudios = {};
          state.mixVolumes = {};
        }
        state.isMixMode = !state.isMixMode;

        // If switching TO Mix Mode, open the sound library
        if (state.isMixMode) {
          toggleSoundLibrary();
        }

        mixModeLabel.textContent = state.isMixMode ? 'Mix Mode: On' : 'Mix Mode: Off';
        renderSoundLibrary();
        renderSoundGrid();
        updatePlayButton();
      });
    }

    // Initialize statistics functionality
    function initStats() {
        const statsBtn = document.getElementById('stats-btn');
        const statsModal = document.getElementById('stats-modal');
        const closeStats = document.getElementById('close-stats');

        if (statsBtn && statsModal && closeStats) {
            statsBtn.addEventListener('click', () => {
                closeAllBottomSheets();
                statsModal.classList.remove('hidden');
                statsModal.classList.add('active');
            });

            closeStats.addEventListener('click', () => {
                statsModal.classList.remove('active');
                statsModal.classList.add('hidden');
            });
        }
    }

    // Initialize statistics (will be called from main DOMContentLoaded)
    function initializeStatistics() {
        initStats();
        loadStats();
    }

    // Statistics tracking
    let stats = {
        totalFocusTime: 0,
        totalBreakTime: 0,
        totalSessions: 0,
        currentSessionStart: null,
        currentSessionType: null
    };

    // Add version constant
    const STATS_VERSION = 1;

    function updateStats(minutes, type) {
      // Update display without timer-specific logic
      const focusTimeElement = document.getElementById('total-focus-time');
      const breakTimeElement = document.getElementById('total-break-time');
      const sessionsElement = document.getElementById('total-sessions');
      
      if (focusTimeElement) focusTimeElement.textContent = stats.totalFocusTime;
      if (breakTimeElement) breakTimeElement.textContent = stats.totalBreakTime;
      if (sessionsElement) sessionsElement.textContent = stats.totalSessions;
      
      // Save to localStorage with version
      localStorage.setItem('focusStats', JSON.stringify({
        version: STATS_VERSION,
        data: stats
      }));
    }

    function loadStats() {
      try {
        const savedStats = localStorage.getItem('focusStats');
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          
          // Check version and migrate if needed
          if (parsed.version !== STATS_VERSION) {
            console.log('Migrating stats from version', parsed.version, 'to', STATS_VERSION);
            // Add migration logic here if needed
          }
          
          stats = parsed.data;
          
          // Update UI
          const focusTimeElement = document.getElementById('total-focus-time');
          const breakTimeElement = document.getElementById('total-break-time');
          const sessionsElement = document.getElementById('total-sessions');
          
          if (focusTimeElement) focusTimeElement.textContent = stats.totalFocusTime;
          if (breakTimeElement) breakTimeElement.textContent = stats.totalBreakTime;
          if (sessionsElement) sessionsElement.textContent = stats.totalSessions;
        }
      } catch (e) {
        console.error('Error loading stats:', e);
        // Reset stats on error
        stats = {
          totalFocusTime: 0,
          totalBreakTime: 0,
          totalSessions: 0,
          currentSessionStart: null,
          currentSessionType: null
        };
      }
    }

    // Start tracking a new session
    function startSession(type) {
        if (!state.sessionStartTime) {
            state.sessionStartTime = Date.now();
            state.sessionType = type;
        }
    }

    // End current session
    function endSession() {
        if (state.sessionStartTime) {
            const duration = Math.floor((Date.now() - state.sessionStartTime) / 1000 / 60);
            if (duration > 0) {
              updateStats(duration, state.sessionType);
            }
            state.sessionStartTime = null;
            state.sessionType = null;
            stats.totalSessions++;
        }
    }

    // Add direct event listener for stats button
    document.getElementById('stats-btn')?.addEventListener('click', function() {
        console.log('Stats button clicked');
        const statsModal = document.getElementById('stats-modal');
        if (statsModal) {
            closeAllBottomSheets();
            statsModal.classList.remove('hidden');
            requestAnimationFrame(() => {
                statsModal.classList.add('active');
            });
        } else {
            console.error('Stats modal not found');
        }
    });

    // Add direct event listener for close button
    document.getElementById('close-stats')?.addEventListener('click', function() {
        console.log('Close button clicked');
        const statsModal = document.getElementById('stats-modal');
        if (statsModal) {
            statsModal.classList.remove('active');
            setTimeout(() => {
                statsModal.classList.add('hidden');
            }, 300);
        }
    });





    // Statistics will be initialized from main DOMContentLoaded handler

    // Enhanced Statistics Modal is now handled by HTML and insights initialization
    // Removed old stats modal code that was overriding the enhanced HTML version

    // Add direct event listener for close button
    document.getElementById('close-stats')?.removeEventListener('click', handleCloseStatsClick);
    document.getElementById('close-stats')?.addEventListener('click', handleCloseStatsClick);

    // --- To-Do List Open/Close Logic ---
    const openTodoBtn = document.getElementById('open-todo-btn');
    const todoSheet = document.getElementById('todo-sheet');
    const closeTodoBtn = document.getElementById('close-todo');

    if (openTodoBtn && todoSheet) {
      openTodoBtn.addEventListener('click', function() {
        if (typeof closeAllBottomSheets === 'function') closeAllBottomSheets();
        todoSheet.classList.remove('hidden');
        requestAnimationFrame(() => {
          todoSheet.classList.add('active');
        });
      });
    }
    if (closeTodoBtn && todoSheet) {
      closeTodoBtn.addEventListener('click', function() {
        todoSheet.classList.remove('active');
        setTimeout(() => {
          todoSheet.classList.add('hidden');
        }, 300);
      });
    }

    // Hide Current Goal toggle logic
    const hideGoalToggle = document.getElementById('hide-goal-toggle');
    const currentGoalContainer = document.querySelector('.current-goal-container');
    if (hideGoalToggle && currentGoalContainer) {
        // Set initial state from localStorage
        const hideGoal = localStorage.getItem('hideCurrentGoal') === 'true';
        hideGoalToggle.checked = hideGoal;
        currentGoalContainer.style.display = hideGoal ? 'none' : '';
        // Toggle handler
        hideGoalToggle.addEventListener('change', function() {
            if (hideGoalToggle.checked) {
                currentGoalContainer.style.display = 'none';
                localStorage.setItem('hideCurrentGoal', 'true');
            } else {
                currentGoalContainer.style.display = '';
                localStorage.setItem('hideCurrentGoal', 'false');
            }
        });
    }
});

// Comprehensive cleanup function
function cleanupAllAudio() {
    // Cleanup main audio
    cleanupAudio();
    
    // Cleanup mix audios
    Object.keys(state.mixAudios).forEach(soundId => {
        stopMixSound(soundId);
    });
    
    // Clear timer interval
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Define the handler function separately
function handleCloseStatsClick() {
    console.log('Close button clicked');
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        statsModal.classList.remove('active');
        setTimeout(() => {
            statsModal.classList.add('hidden');
        }, 300);
    }
}

// New Todo List Implementation for Updated Design
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const currentDateEl = document.getElementById('current-date');
    const newTaskInput = document.getElementById('new-task-input');
    const focusTasksList = document.getElementById('focus-tasks');
    const nextTasksList = document.getElementById('next-tasks');
    const doneTasksList = document.getElementById('done-tasks');
    const taskCountText = document.getElementById('task-count-text');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    
    // State
    let tasks = [];
    let currentDate = new Date();
    
    // Initialize
    init();
    
    function init() {
        updateDateDisplay();
        loadTasks();
        setupEventListeners();
        renderTasks();
        updateTaskCount();
        updateSectionTitles();
    }
    
    function updateDateDisplay() {
        const dayNumber = currentDate.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthAbbr = months[currentDate.getMonth()];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayAbbr = days[currentDate.getDay()];
        
        if (currentDateEl) {
            // Check if the proper structure exists, if not create it
            let dayNumberEl = currentDateEl.querySelector('.day-number');
            let monthEl = currentDateEl.querySelector('.month');
            let weekdayEl = currentDateEl.querySelector('.weekday');
            
            if (!dayNumberEl || !monthEl || !weekdayEl) {
                // Create the proper structure if it doesn't exist
                currentDateEl.innerHTML = `
                    <div class="date-display">
                        <span class="day-number">${dayNumber}</span>
                        <div class="date-info">
                            <span class="month">${monthAbbr}</span>
                            <span class="weekday">${dayAbbr}</span>
                        </div>
                    </div>
                `;
            } else {
                // Update existing elements
                dayNumberEl.textContent = dayNumber;
                monthEl.textContent = monthAbbr;
                weekdayEl.textContent = dayAbbr;
            }
        }
    }
    
    function setupEventListeners() {
        // New task input
        if (newTaskInput) {
            newTaskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    addNewTask(this.value.trim());
                    this.value = '';
                }
            });
        }
        
        // Date navigation
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() - 1);
                updateDateDisplay();
                loadTasks();
                renderTasks();
                updateTaskCount();
                updateSectionTitles();
            });
        }
        
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() + 1);
                updateDateDisplay();
                loadTasks();
                renderTasks();
                updateTaskCount();
                updateSectionTitles();
            });
        }
        
        // Setup drag and drop between sections
        setupDragAndDrop();
    }
    
    function addNewTask(text) {
        const task = {
            id: Date.now() + Math.random(),
            text: text,
            status: 'next', // Default to next section
            date: getDateKey(currentDate),
            createdAt: new Date().toISOString()
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateGoalFromTodo();
        updateSectionTitles();
    }
    
    function renderTasks() {
        const todayKey = getDateKey(currentDate);
        const todayTasks = tasks.filter(task => task.date === todayKey);
        
        // Clear existing tasks
        if (focusTasksList) focusTasksList.innerHTML = '';
        if (nextTasksList) nextTasksList.innerHTML = '';
        if (doneTasksList) doneTasksList.innerHTML = '';
        
        // Render tasks in their respective sections
        todayTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            
            switch (task.status) {
                case 'focus':
                    if (focusTasksList) focusTasksList.appendChild(taskElement);
                    break;
                case 'next':
                    if (nextTasksList) nextTasksList.appendChild(taskElement);
                    break;
                case 'done':
                    if (doneTasksList) doneTasksList.appendChild(taskElement);
                    break;
            }
        });
        
        // Add empty placeholders for drag zones
        addEmptyDropZones(todayTasks);
    }
    
    function addEmptyDropZones(todayTasks) {
        const focusTasks = todayTasks.filter(task => task.status === 'focus');
        const nextTasks = todayTasks.filter(task => task.status === 'next');
        const doneTasks = todayTasks.filter(task => task.status === 'done');
        
        // Add empty placeholder if section is empty
        if (focusTasks.length === 0 && focusTasksList) {
            const placeholder = createEmptyPlaceholder('Drop tasks here to focus on them');
            focusTasksList.appendChild(placeholder);
        }
        
        if (nextTasks.length === 0 && nextTasksList) {
            const placeholder = createEmptyPlaceholder('Drop tasks here to plan for later');
            nextTasksList.appendChild(placeholder);
        }
        
        if (doneTasks.length === 0 && doneTasksList) {
            const placeholder = createEmptyPlaceholder('Drop completed tasks here');
            doneTasksList.appendChild(placeholder);
        }
    }
    
    function createEmptyPlaceholder(text) {
        const placeholder = document.createElement('li');
        placeholder.className = 'empty-placeholder';
        placeholder.innerHTML = `
            <div class="empty-placeholder-content">
                <span class="empty-placeholder-text">${text}</span>
            </div>
        `;
        return placeholder;
    }
    
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.taskId = task.id;
        
        li.innerHTML = `
            <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}">
                ${task.status === 'done' ? 
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' :
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/></svg>'
                }
            </div>
            <span class="task-text ${task.status === 'done' ? 'completed' : ''}">${task.text}</span>
        `;
        
        // Setup task events
        setupTaskEvents(li, task);
        
        return li;
    }
    
    function setupTaskEvents(element, task) {
        const checkbox = element.querySelector('.task-checkbox');
        const textSpan = element.querySelector('.task-text');
        
        // Checkbox click handler
        if (checkbox) {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const reverse = e.shiftKey; // Hold Shift for reverse cycle
                toggleTaskStatus(task, reverse);
            });
        }
        
        // Make text editable on double click
        if (textSpan) {
            textSpan.addEventListener('dblclick', (e) => {
                makeTextEditable(textSpan, task);
            });
        }
        
        // Drag events
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            element.classList.add('dragging');
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }
    
    function toggleTaskStatus(task, reverse = false) {
        // Find the task in the tasks array and update it directly
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex === -1) {
            return;
        }
        
        if (reverse) {
            // Reverse cycle: next <- focus <- done <- next
            switch (tasks[taskIndex].status) {
                case 'next':
                    tasks[taskIndex].status = 'done';
                    break;
                case 'focus':
                    tasks[taskIndex].status = 'next';
                    break;
                case 'done':
                    tasks[taskIndex].status = 'focus';
                    break;
            }
        } else {
            // Forward cycle: next -> focus -> done -> next
            switch (tasks[taskIndex].status) {
                case 'next':
                    tasks[taskIndex].status = 'focus';
                    break;
                case 'focus':
                    tasks[taskIndex].status = 'done';
                    break;
                case 'done':
                    tasks[taskIndex].status = 'next';
                    break;
            }
        }
        
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateGoalFromTodo();
        updateSectionTitles();
    }
    
    function makeTextEditable(textElement, task) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'task-edit-input';
        
        textElement.replaceWith(input);
        input.focus();
        input.select();
        
        function finishEditing() {
            const newText = input.value.trim();
            if (newText && newText !== task.text) {
                // Find and update the task in the tasks array
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].text = newText;
                    saveTasks();
                }
            }
            renderTasks();
            updateGoalFromTodo();
        }
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            }
        });
    }
    
    function setupDragAndDrop() {
        const sections = [focusTasksList, nextTasksList, doneTasksList];
        const sectionMap = {
            'focus-tasks': 'focus',
            'next-tasks': 'next',
            'done-tasks': 'done'
        };
        
        sections.forEach(section => {
            if (!section) return;
            
            section.addEventListener('dragover', (e) => {
                e.preventDefault();
                section.classList.add('drag-over');
            });
            
            section.addEventListener('dragleave', (e) => {
                if (!section.contains(e.relatedTarget)) {
                    section.classList.remove('drag-over');
                }
            });
            
            section.addEventListener('drop', (e) => {
                e.preventDefault();
                section.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const task = tasks.find(t => t.id.toString() === taskId);
                const newStatus = sectionMap[section.id];
                
                if (task && newStatus && task.status !== newStatus) {
                    task.status = newStatus;
                    saveTasks();
                    renderTasks();
                    updateTaskCount();
                    updateGoalFromTodo();
                    updateSectionTitles();
                }
            });
        });
    }
    
    function updateTaskCount() {
        if (!taskCountText) return;
        
        const todayKey = getDateKey(currentDate);
        const todayTasks = tasks.filter(task => task.date === todayKey);
        const count = todayTasks.length;
        
        taskCountText.textContent = `${count} task${count !== 1 ? 's' : ''}`;
    }
    
    function loadTasks() {
        const stored = localStorage.getItem('todoTasks');
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading tasks:', e);
                tasks = [];
            }
        } else {
            // Load demo tasks for first time users
            tasks = [
                {
                    id: 1,
                    text: 'Stop and thank for all you have',
                    status: 'focus',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    text: 'Help someone',
                    status: 'next',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    text: 'Training',
                    status: 'next',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 4,
                    text: 'Refuel and pack jeep for the trip',
                    status: 'next',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 5,
                    text: 'Order coffee beans and filters from Miro',
                    status: 'next',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 6,
                    text: 'Review the planning documents',
                    status: 'done',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 7,
                    text: 'Sync with the team',
                    status: 'done',
                    date: getDateKey(currentDate),
                    createdAt: new Date().toISOString()
                }
            ];
            saveTasks();
        }
    }
    
    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }
    
    function getDateKey(date) {
        return date.toISOString().split('T')[0];
    }
    
    function updateSectionTitles() {
        const nextSectionTitle = document.querySelector('.next-section .section-title');
        if (!nextSectionTitle) return;
        
        const todayKey = getDateKey(currentDate);
        const todayTasks = tasks.filter(task => task.date === todayKey);
        const focusTasks = todayTasks.filter(task => task.status === 'focus');
        
        // If no focus tasks, show "Tasks", otherwise show "Next"
        nextSectionTitle.textContent = focusTasks.length === 0 ? 'Tasks' : 'Next';
    }
    
    // Delete task function (can be called from UI if needed)
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCount();
        updateGoalFromTodo();
        updateSectionTitles();
    }
    

    // Export functions for external use
    window.todoApp = {
        addTask: addNewTask,
        deleteTask: deleteTask,
        getTasks: () => tasks,
        renderTasks: renderTasks
    };
});
  
// Helper: Update timer goal from focus tasks
function updateGoalFromTodo() {
  const goalDiv = document.getElementById('current-goal');
  if (!goalDiv) return;
  
  // Get tasks from the new todo app if available
  if (window.todoApp) {
    const tasks = window.todoApp.getTasks();
    const today = new Date().toISOString().split('T')[0];
    const focusTask = tasks.find(task => 
      task.date === today && 
      task.status === 'focus' && 
      task.text.trim() !== ''
    );
    
    if (focusTask) {
      goalDiv.textContent = focusTask.text;
      goalDiv.style.color = '#fff';
      goalDiv.setAttribute('data-auto', 'true');
    } else if (goalDiv.getAttribute('data-auto') === 'true') {
      // If previously auto-set, reset to placeholder
      goalDiv.textContent = 'Goal for This Session?';
      goalDiv.style.color = '#bdbdbd';
      goalDiv.removeAttribute('data-auto');
    }
  }
}
  
  





  
  
function stopMixSound(soundId) {
  if (state.mixAudios[soundId]) {
    const audio = state.mixAudios[soundId];
    audio.pause();
    audio.currentTime = 0;
    
    // Remove event listeners to prevent memory leaks
    if (audio.onended) audio.onended = null;
    if (audio.onerror) audio.onerror = null;
    audio.src = '';
    audio.load(); // Force cleanup
    
    // Consistent cleanup of both audio and volume state
    delete state.mixAudios[soundId];
    delete state.mixVolumes[soundId];
  }
}

function playMixSound(sound) {
  // Stop any existing instance of this sound
  stopMixSound(sound.id);
  
  // Create new audio instance
  const audio = new Audio(sound.url);
  state.mixAudios[sound.id] = audio;
  
  // Add cleanup on end
  audio.onended = () => {
    stopMixSound(sound.id);
  };
  
  // Add error handling
  audio.onerror = (e) => {
    console.error('Mix sound loading error:', e);
    stopMixSound(sound.id);
  };
  
  // Play with error handling
  audio.play().catch(e => {
    console.error('Mix sound playback error:', e);
    stopMixSound(sound.id);
  });
}

// --- Timer Functionality ---
// Timer settings
let timerSettings = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 15,
  totalCycles: 4,
  simpleTimer: 25,
  sleepTimer: 30,
  selectedToneId: null,
  showGoal: true,
  sessionGoal: '',
  currentPreset: 'classic'
};

// Preset configurations
const presets = {
  classic: {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    totalCycles: 4
  },
  extended: {
    focusTime: 50,
    shortBreak: 10,
    longBreak: 30,
    totalCycles: 4
  }
};

// Available tones from Supabase
let availableTones = [];
let currentTone = null;

// Timer state
let timerMode = 'focus';
let timerType = 'pomodoro';
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let isTimerRunning = false;
let isTimerEditing = false;
let timerInterval = null;
let elapsedTime = 0;
let currentCycle = 0;
let cyclePhase = 'focus'; // 'focus', 'short-break', 'long-break'
let cycleDots = [];

// DOM Elements
const timerContainer = document.getElementById('timer-container');
const timerBtn = document.getElementById('timer-btn');
const timerDisplay = document.getElementById('timerDisplay');
const timeDisplay = document.getElementById('time');
const progressBar = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const decreaseBtn = document.getElementById('decrease');
const increaseBtn = document.getElementById('increase');
const modeButtons = document.querySelectorAll('.mode-btn');
const modeSwitcher = document.getElementById('modeSwitcher');
const timerTypeDots = document.querySelectorAll('.timer-type-dot');
const cyclesContainer = document.getElementById('cyclesContainer');
const timerSettingsModal = document.getElementById('timerSettingsModal');
const closeTimerSettingsBtn = document.getElementById('closeTimerSettingsBtn');
const cancelTimerSettingsBtn = document.getElementById('cancelTimerSettingsBtn');
const saveTimerSettingsBtn = document.getElementById('saveTimerSettingsBtn');
const focusTimeInput = document.getElementById('focusTimeInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const cyclesInput = document.getElementById('cyclesInput');
const simpleTimerInput = document.getElementById('simpleTimerInput');
const sleepTimerInput = document.getElementById('sleepTimerInput');
const toneSelect = document.getElementById('toneSelect');
const goalSection = document.getElementById('goalSection');
const goalInput = document.getElementById('goalInput');
const showGoalCheckbox = document.getElementById('showGoalCheckbox');
const playSoundBtn = document.getElementById('playSoundBtn');
const presetButtons = document.querySelectorAll('.preset-btn');
const soundGrid = document.getElementById('sound-grid');

// Initialize timer functionality
function initializeTimer() {
  if (!timerBtn) return;
  
  // Timer button toggle
  timerBtn.addEventListener('click', toggleTimer);
  
  // Load settings and initialize
  loadTimerSettings();
  loadTones();
  createCycleDots();
  updateGoalDisplay();
  updateTimerDisplay();
  detectCurrentPreset();
  updatePresetButtons();
  
  // Event listeners
  if (startBtn) startBtn.addEventListener('click', toggleTimerState);
  if (pauseBtn) pauseBtn.addEventListener('click', toggleTimerState);
  if (restartBtn) restartBtn.addEventListener('click', resetTimer);
  if (decreaseBtn) decreaseBtn.addEventListener('click', () => adjustTime(-60));
  if (increaseBtn) increaseBtn.addEventListener('click', () => adjustTime(60));
  if (timeDisplay) timeDisplay.addEventListener('click', handleTimeClick);
  
  // Settings event listeners
  if (closeTimerSettingsBtn) {
    closeTimerSettingsBtn.addEventListener('click', closeTimerSettings);
  }
  if (cancelTimerSettingsBtn) {
    cancelTimerSettingsBtn.addEventListener('click', closeTimerSettings);
  }
  if (saveTimerSettingsBtn) {
    saveTimerSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveTimerSettingsToStorage();
    });
  }
  
  // Mode buttons
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!isTimerRunning && timerType === 'pomodoro') {
        toggleTimerMode(btn.dataset.mode);
      }
    });
  });
  
  // Timer type dots
  timerTypeDots.forEach(dot => {
    dot.addEventListener('click', () => {
      if (!isTimerRunning) {
        changeTimerType(dot.dataset.timerType);
      }
    });
  });
  
  // Goal input
  if (goalInput) {
    goalInput.addEventListener('input', () => {
      timerSettings.sessionGoal = goalInput.value;
      saveTimerSettingsToStorage();
    });
    
    goalInput.addEventListener('blur', () => {
      timerSettings.sessionGoal = goalInput.value;
      saveTimerSettingsToStorage();
    });
  }
  
  // Play sound button
  if (playSoundBtn) {
    playSoundBtn.addEventListener('click', playFocusSound);
  }
  
  // Preset buttons
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
    });
  });
  
  // Input change listeners to switch to custom preset
  const pomodoroInputs = [focusTimeInput, shortBreakInput, longBreakInput, cyclesInput];
  pomodoroInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        setTimeout(() => {
          detectCurrentPreset();
          updatePresetButtons();
        }, 10);
      });
    }
  });
  
  // Close settings when clicking outside
  if (timerSettingsModal) {
    timerSettingsModal.addEventListener('click', (e) => {
      if (e.target === timerSettingsModal) {
        closeTimerSettings();
      }
    });
  }
}

// Toggle timer visibility
function toggleTimer() {
  if (timerContainer.classList.contains('hidden')) {
    // Show timer, hide sound grid
    timerContainer.classList.remove('hidden');
    soundGrid.classList.add('hidden');
  } else {
    // Hide timer, show sound grid
    timerContainer.classList.add('hidden');
    soundGrid.classList.remove('hidden');
  }
}

// Apply preset configuration
function applyPreset(presetName) {
  if (presets[presetName]) {
    const preset = presets[presetName];
    timerSettings.focusTime = preset.focusTime;
    timerSettings.shortBreak = preset.shortBreak;
    timerSettings.longBreak = preset.longBreak;
    timerSettings.totalCycles = preset.totalCycles;
    timerSettings.currentPreset = presetName;
    
    // Update input values
    if (focusTimeInput) focusTimeInput.value = preset.focusTime;
    if (shortBreakInput) shortBreakInput.value = preset.shortBreak;
    if (longBreakInput) longBreakInput.value = preset.longBreak;
    if (cyclesInput) cyclesInput.value = preset.totalCycles;
  } else if (presetName === 'custom') {
    timerSettings.currentPreset = 'custom';
  }
  
  updatePresetButtons();
}

// Update preset button states
function updatePresetButtons() {
  presetButtons.forEach(btn => {
    if (btn.dataset.preset === timerSettings.currentPreset) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Detect if current settings match a preset
function detectCurrentPreset() {
  for (const [presetName, preset] of Object.entries(presets)) {
    if (timerSettings.focusTime === preset.focusTime &&
        timerSettings.shortBreak === preset.shortBreak &&
        timerSettings.longBreak === preset.longBreak &&
        timerSettings.totalCycles === preset.totalCycles) {
      timerSettings.currentPreset = presetName;
      return;
    }
  }
  timerSettings.currentPreset = 'custom';
}

// Load settings from localStorage
function loadTimerSettings() {
  const savedSettings = localStorage.getItem('pomodoroSettings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    timerSettings = { ...timerSettings, ...parsed };
    
    // Update input values
    if (focusTimeInput) focusTimeInput.value = timerSettings.focusTime;
    if (shortBreakInput) shortBreakInput.value = timerSettings.shortBreak;
    if (longBreakInput) longBreakInput.value = timerSettings.longBreak;
    if (cyclesInput) cyclesInput.value = timerSettings.totalCycles;
    if (simpleTimerInput) simpleTimerInput.value = timerSettings.simpleTimer;
    if (sleepTimerInput) sleepTimerInput.value = timerSettings.sleepTimer;
    
    // Update goal settings
    if (showGoalCheckbox) showGoalCheckbox.checked = timerSettings.showGoal;
    if (goalInput) goalInput.value = timerSettings.sessionGoal;
    updateGoalDisplay();
    
    // Detect and update preset
    detectCurrentPreset();
    updatePresetButtons();
  }
}

// Save settings to localStorage
function saveTimerSettingsToStorage() {
  console.log('Save button clicked');
  
  // Get values from inputs
  const newFocusTime = parseInt(focusTimeInput?.value) || 25;
  const newShortBreak = parseInt(shortBreakInput?.value) || 5;
  const newLongBreak = parseInt(longBreakInput?.value) || 15;
  const newTotalCycles = parseInt(cyclesInput?.value) || 4;
  const newSimpleTimer = parseInt(simpleTimerInput?.value) || 25;
  const newSleepTimer = parseInt(sleepTimerInput?.value) || 30;
  const newSelectedToneId = toneSelect?.value || null;
  const newShowGoal = showGoalCheckbox?.checked ?? true;
  const newSessionGoal = goalInput?.value || '';
  
  // Update settings
  timerSettings.focusTime = newFocusTime;
  timerSettings.shortBreak = newShortBreak;
  timerSettings.longBreak = newLongBreak;
  timerSettings.totalCycles = newTotalCycles;
  timerSettings.simpleTimer = newSimpleTimer;
  timerSettings.sleepTimer = newSleepTimer;
  timerSettings.selectedToneId = newSelectedToneId;
  timerSettings.showGoal = newShowGoal;
  timerSettings.sessionGoal = newSessionGoal;
  
  // Update current tone
  if (newSelectedToneId) {
    currentTone = availableTones.find(tone => tone.id === newSelectedToneId);
  } else {
    currentTone = null;
  }
  
  // Save to localStorage
  localStorage.setItem('pomodoroSettings', JSON.stringify(timerSettings));
  
  // Refresh all timers immediately
  if (timerType === 'pomodoro') {
    setTimeForMode();
    createCycleDots();
  } else if (timerType === 'simple') {
    timeLeft = timerSettings.simpleTimer * 60;
    totalTime = timerSettings.simpleTimer * 60;
  } else if (timerType === 'sleep') {
    timeLeft = timerSettings.sleepTimer * 60;
    totalTime = timerSettings.sleepTimer * 60;
  }
  
  // Update display and goal visibility
  updateTimerDisplay();
  updateGoalDisplay();
  
  // Close the settings modal
  closeTimerSettings();
}

// Update goal display visibility
function updateGoalDisplay() {
  if (!goalSection) return;
  
  if (timerSettings.showGoal) {
    goalSection.classList.remove('hidden');
  } else {
    goalSection.classList.add('hidden');
  }
}

// Load tones from Supabase
async function loadTones() {
  console.log('Loading tones from Supabase...');
  try {
    if (!supabase) {
      console.log('Supabase not available');
      return;
    }
    
    const { data, error } = await supabase
      .from('tone')
      .select('*');
    
    if (error) throw error;
    
    availableTones = data || [];
    console.log('Tones loaded:', availableTones);
    populateToneSelect();
    
    // Set current tone based on saved selection
    if (timerSettings.selectedToneId) {
      currentTone = availableTones.find(tone => tone.id === timerSettings.selectedToneId);
      console.log('Current tone set:', currentTone);
    }
  } catch (error) {
    console.error('Failed to load tones:', error);
  }
}

// Populate tone select dropdown
function populateToneSelect() {
  if (!toneSelect) return;
  
  // Clear existing options
  toneSelect.innerHTML = '<option value="">No Sound</option>';
  
  // Add tone options
  availableTones.forEach(tone => {
    const option = document.createElement('option');
    option.value = tone.id;
    option.textContent = tone.name;
    if (tone.id === timerSettings.selectedToneId) {
      option.selected = true;
    }
    toneSelect.appendChild(option);
  });
  
  console.log('Tone select populated with', availableTones.length, 'tones');
}

// Play sound based on timer type and completion
async function playCompletionSound(completionType) {
  if (!currentTone) return;
  
  let soundUrl = '';
  
  switch (completionType) {
    case 'focus':
      soundUrl = currentTone.focus_timer_url;
      break;
    case 'short-break':
      soundUrl = currentTone.short_break_url;
      break;
    case 'long-break':
      soundUrl = currentTone.long_break_url;
      break;
    case 'cycle-complete':
      soundUrl = currentTone.cycle_complete_url || currentTone.short_break_url;
      break;
    case 'countdown':
      soundUrl = currentTone.countdown_timer_url;
      break;
    case 'sleep':
      soundUrl = currentTone.sleep_timer_url;
      break;
  }
  
  if (soundUrl) {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }
}

// Play focus timer sound preview
async function playFocusSound() {
  if (!toneSelect || !availableTones.length) return;
  
  const selectedToneId = toneSelect.value;
  if (!selectedToneId) return;
  
  const selectedTone = availableTones.find(tone => tone.id === selectedToneId);
  if (!selectedTone || !selectedTone.focus_timer_url) return;
  
  try {
    if (playSoundBtn) playSoundBtn.disabled = true;
    const audio = new Audio(selectedTone.focus_timer_url);
    audio.volume = 0.7;
    await audio.play();
  } catch (error) {
    console.error('Failed to play focus sound:', error);
  } finally {
    if (playSoundBtn) playSoundBtn.disabled = false;
  }
}

// Create cycle dots
function createCycleDots() {
  if (!cyclesContainer) return;
  
  cyclesContainer.innerHTML = '';
  cycleDots = [];
  
  for (let i = 0; i < timerSettings.totalCycles; i++) {
    const dot = document.createElement('div');
    dot.className = 'cycle-dot';
    cyclesContainer.appendChild(dot);
    cycleDots.push(dot);
  }
  
  updateCycleDots();
}

// Update cycle dots display
function updateCycleDots() {
  cycleDots.forEach((dot, index) => {
    dot.className = 'cycle-dot';
    
    if (index < Math.floor(currentCycle)) {
      dot.classList.add('full-filled');
    } else if (index === Math.floor(currentCycle) && cyclePhase === 'short-break') {
      dot.classList.add('half-filled');
    }
  });
}

// Get current time based on mode and settings
function getCurrentTime() {
  switch (timerMode) {
    case 'focus':
      return timerSettings.focusTime * 60;
    case 'short-break':
      return timerSettings.shortBreak * 60;
    case 'long-break':
      return timerSettings.longBreak * 60;
    default:
      return timerSettings.focusTime * 60;
  }
}

// Set time based on current mode
function setTimeForMode() {
  const newTime = getCurrentTime();
  timeLeft = newTime;
  totalTime = newTime;
}

// Format time display
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Parse time string to seconds
function parseTime(timeString) {
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0] * 60;
  }
  
  return 0;
}

// Update timer display
function updateTimerDisplay() {
  if (!timeDisplay || !progressBar) return;
  
  if (timerType === 'endless') {
    timeDisplay.textContent = formatTime(elapsedTime);
    progressBar.style.width = '0%';
    if (cyclesContainer) cyclesContainer.classList.add('hidden');
  } else {
    timeDisplay.textContent = formatTime(timeLeft);
    const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    if (timerType === 'pomodoro') {
      if (cyclesContainer) cyclesContainer.classList.remove('hidden');
      updateCycleDots();
    } else {
      if (cyclesContainer) cyclesContainer.classList.add('hidden');
    }
  }
  
  // Toggle button visibility
  if (isTimerRunning) {
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.classList.add('visible');
    if (restartBtn) restartBtn.classList.add('visible');
  } else {
    if (startBtn) startBtn.style.display = 'flex';
    if (pauseBtn) pauseBtn.classList.remove('visible');
    if (restartBtn) restartBtn.classList.remove('visible');
  }
}

// Debounce timer controls to prevent race conditions
let timerControlDebounce = false;

// Toggle timer state
function toggleTimerState() {
  // Prevent rapid clicking
  if (timerControlDebounce) return;
  timerControlDebounce = true;
  setTimeout(() => { timerControlDebounce = false; }, 300);
  
  if (isTimerRunning) {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    enableControls();
  } else {
    if (timerType !== 'endless' && timeLeft <= 0) resetTimer();
    
    timerInterval = setInterval(() => {
      if (timerType === 'endless') {
        elapsedTime++;
        updateTimerDisplay();
      } else {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isTimerRunning = false;
          
          if (timerType === 'pomodoro') {
            handlePomodoroComplete();
          } else {
            // Record simple timer completion as focus time
            if (timerType === 'simple') {
              const simpleMinutes = Math.round(timerSettings.simpleTimer);
              recordTimerData('focus', simpleMinutes, true);
            } else if (timerType === 'sleep') {
              const sleepMinutes = Math.round(timerSettings.sleepTimer);
              recordTimerData('focus', sleepMinutes, true);
            }
            
            playCompletionSound('countdown');
            enableControls();
          }
        }
      }
    }, 1000);
    
    isTimerRunning = true;
    disableControls();
  }
  
  updateTimerDisplay();
}

// Handle Pomodoro cycle completion
async function handlePomodoroComplete() {
  if (cyclePhase === 'focus') {
    // Record focus time
    const focusMinutes = Math.round(timerSettings.focusTime);
    recordTimerData('focus', focusMinutes, true);
    
    await playCompletionSound('focus');
    cyclePhase = 'short-break';
    toggleTimerMode('short-break');
    toggleTimerState(); // Auto-start short break
  } else if (cyclePhase === 'short-break') {
    // Record break time
    const breakMinutes = Math.round(timerSettings.shortBreak);
    recordTimerData('break', breakMinutes, true);
    
    currentCycle++;
    
    if (currentCycle >= timerSettings.totalCycles) {
      // Record completed session
      recordTimerData('session', 1, true);
      
      await playCompletionSound('cycle-complete');
      cyclePhase = 'long-break';
      toggleTimerMode('long-break');
      toggleTimerState(); // Auto-start long break
    } else {
      await playCompletionSound('short-break');
      cyclePhase = 'focus';
      toggleTimerMode('focus');
      toggleTimerState(); // Auto-start next focus
    }
  } else if (cyclePhase === 'long-break') {
    // Record long break time
    const longBreakMinutes = Math.round(timerSettings.longBreak);
    recordTimerData('break', longBreakMinutes, true);
    
    await playCompletionSound('long-break');
    currentCycle = 0;
    cyclePhase = 'focus';
    toggleTimerMode('focus');
    enableControls();
  }
  
  updateCycleDots();
}

// Reset timer
function resetTimer() {
  // Prevent rapid clicking
  if (timerControlDebounce) return;
  timerControlDebounce = true;
  setTimeout(() => { timerControlDebounce = false; }, 300);
  
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerRunning = false;
  
  if (timerType === 'endless') {
    elapsedTime = 0;
  } else if (timerType === 'pomodoro') {
    currentCycle = 0;
    cyclePhase = 'focus';
    timerMode = 'focus';
    setTimeForMode();
  } else if (timerType === 'simple') {
    timeLeft = timerSettings.simpleTimer * 60;
    totalTime = timerSettings.simpleTimer * 60;
  }
  
  updateTimerDisplay();
  enableControls();
  
  // Update mode buttons
  modeButtons.forEach(btn => {
    if (btn.dataset.mode === timerMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Toggle mode (only for pomodoro)
function toggleTimerMode(newMode) {
  if (newMode === timerMode || timerType !== 'pomodoro') return;
  
  timerMode = newMode;
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerRunning = false;
  
  setTimeForMode();
  updateTimerDisplay();
  enableControls();
  
  // Update active button
  modeButtons.forEach(btn => {
    if (btn.dataset.mode === timerMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Change timer type
function changeTimerType(newType) {
  if (newType === timerType) return;
  
  // Handle settings dot click
  if (newType === 'settings') {
    openTimerSettings();
    return;
  }
  
  timerType = newType;
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerRunning = false;
  
  // Reset cycles when changing timer type
  currentCycle = 0;
  cyclePhase = 'focus';
  
  // Update timer settings based on type
  if (timerType === 'pomodoro') {
    if (modeSwitcher) modeSwitcher.classList.remove('hidden');
    timerMode = 'focus';
    setTimeForMode();
    createCycleDots();
  } else if (timerType === 'simple') {
    if (modeSwitcher) modeSwitcher.classList.add('hidden');
    timeLeft = timerSettings.simpleTimer * 60;
    totalTime = timerSettings.simpleTimer * 60;
  } else if (timerType === 'sleep') {
    if (modeSwitcher) modeSwitcher.classList.add('hidden');
    timeLeft = timerSettings.sleepTimer * 60;
    totalTime = timerSettings.sleepTimer * 60;
  } else if (timerType === 'endless') {
    if (modeSwitcher) modeSwitcher.classList.add('hidden');
    elapsedTime = 0;
  }
  
  // Update active dot
  timerTypeDots.forEach(dot => {
    if (dot.dataset.timerType === timerType) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  // Update mode buttons
  modeButtons.forEach(btn => {
    if (btn.dataset.mode === 'focus') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  updateTimerDisplay();
  enableControls();
}

// Adjust time
function adjustTime(amount) {
  if (isTimerRunning || timerType === 'endless') return;
  
  timeLeft = Math.max(0, timeLeft + amount);
  totalTime = timeLeft;
  
  // Update settings if in pomodoro mode or sleep mode
  if (timerType === 'pomodoro') {
    const minutes = Math.round(timeLeft / 60);
    if (timerMode === 'focus') {
      timerSettings.focusTime = minutes;
      if (focusTimeInput) focusTimeInput.value = minutes;
    } else if (timerMode === 'short-break') {
      timerSettings.shortBreak = minutes;
      if (shortBreakInput) shortBreakInput.value = minutes;
    } else if (timerMode === 'long-break') {
      timerSettings.longBreak = minutes;
      if (longBreakInput) longBreakInput.value = minutes;
    }
  } else if (timerType === 'simple') {
    const minutes = Math.round(timeLeft / 60);
    timerSettings.simpleTimer = minutes;
    if (simpleTimerInput) simpleTimerInput.value = minutes;
  } else if (timerType === 'sleep') {
    const minutes = Math.round(timeLeft / 60);
    timerSettings.sleepTimer = minutes;
    if (sleepTimerInput) sleepTimerInput.value = minutes;
  }
  
  updateTimerDisplay();
}

// Handle time display click for editing
function handleTimeClick() {
  if (isTimerRunning || isTimerEditing || timerType === 'endless') return;
  
  isTimerEditing = true;
  
  // Replace display with input
  const currentTimeText = timeDisplay.textContent;
  timeDisplay.innerHTML = `<input type="text" class="time-input" value="${currentTimeText}" maxlength="8">`;
  
  const timeInput = document.querySelector('.time-input');
  timeInput.focus();
  timeInput.select();
  
  // Handle input blur
  timeInput.addEventListener('blur', finishEditing);
  
  // Handle enter key
  timeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    }
  });
  
  // Handle input
  timeInput.addEventListener('input', (e) => {
    // Allow only numbers and colon
    e.target.value = e.target.value.replace(/[^0-9:]/g, '');
  });
}

// Finish editing time
function finishEditing() {
  const timeInput = document.querySelector('.time-input');
  if (!timeInput) return;
  
  let timeValue = timeInput.value;
  
  // Process numeric-only input
  if (!timeValue.includes(':')) {
    const minutes = parseInt(timeValue, 10) || 0;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      timeValue = `${hours}:${mins.toString().padStart(2, '0')}:00`;
    } else {
      timeValue = `${mins.toString().padStart(2, '0')}:00`;
    }
  } else if (timeValue.split(':').length === 2) {
    const [mins, secs] = timeValue.split(':');
    timeValue = `${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`;
  } else if (timeValue.split(':').length === 3) {
    const [hours, mins, secs] = timeValue.split(':');
    timeValue = `${hours}:${mins.padStart(2, '0')}:${secs.padStart(2, '0')}`;
  }
  
  // Parse and update time
  timeLeft = parseTime(timeValue);
  totalTime = timeLeft;
  
  // Update settings
  if (timerType === 'pomodoro') {
    const minutes = Math.round(timeLeft / 60);
    if (timerMode === 'focus') {
      timerSettings.focusTime = minutes;
      if (focusTimeInput) focusTimeInput.value = minutes;
    } else if (timerMode === 'short-break') {
      timerSettings.shortBreak = minutes;
      if (shortBreakInput) shortBreakInput.value = minutes;
    } else if (timerMode === 'long-break') {
      timerSettings.longBreak = minutes;
      if (longBreakInput) longBreakInput.value = minutes;
    }
  } else if (timerType === 'simple') {
    const minutes = Math.round(timeLeft / 60);
    timerSettings.simpleTimer = minutes;
    if (simpleTimerInput) simpleTimerInput.value = minutes;
  } else if (timerType === 'sleep') {
    const minutes = Math.round(timeLeft / 60);
    timerSettings.sleepTimer = minutes;
    if (sleepTimerInput) sleepTimerInput.value = minutes;
  }
  
  // Restore display
  timeDisplay.innerHTML = '';
  timeDisplay.textContent = formatTime(timeLeft);
  isTimerEditing = false;
}

// Settings functions
function openTimerSettings() {
  // Update input values with current settings
  if (focusTimeInput) focusTimeInput.value = timerSettings.focusTime;
  if (shortBreakInput) shortBreakInput.value = timerSettings.shortBreak;
  if (longBreakInput) longBreakInput.value = timerSettings.longBreak;
  if (cyclesInput) cyclesInput.value = timerSettings.totalCycles;
  if (simpleTimerInput) simpleTimerInput.value = timerSettings.simpleTimer;
  if (sleepTimerInput) sleepTimerInput.value = timerSettings.sleepTimer;
  
  // Update goal settings
  if (showGoalCheckbox) showGoalCheckbox.checked = timerSettings.showGoal;
  
  // Update tone selection
  if (toneSelect) {
    toneSelect.value = timerSettings.selectedToneId || '';
  }
  
  // Detect current preset and update buttons
  detectCurrentPreset();
  updatePresetButtons();
  
  if (timerSettingsModal) timerSettingsModal.classList.add('open');
}

function closeTimerSettings() {
  if (timerSettingsModal) timerSettingsModal.classList.remove('open');
}

// Disable controls during running state
function disableControls() {
  if (decreaseBtn) decreaseBtn.classList.add('disabled');
  if (increaseBtn) increaseBtn.classList.add('disabled');
  modeButtons.forEach(btn => btn.classList.add('disabled'));
  if (timerDisplay) timerDisplay.classList.add('disabled');
  timerTypeDots.forEach(dot => dot.parentElement?.classList.add('disabled'));
}

// Enable controls when not running
function enableControls() {
  if (decreaseBtn) decreaseBtn.classList.remove('disabled');
  if (increaseBtn) increaseBtn.classList.remove('disabled');
  modeButtons.forEach(btn => btn.classList.remove('disabled'));
  if (timerDisplay) timerDisplay.classList.remove('disabled');
  timerTypeDots.forEach(dot => dot.parentElement?.classList.remove('disabled'));
}

// --- Insights Dashboard Functionality ---
let insightsData = {
  focus: {}, // Date -> minutes
  break: {}, // Date -> minutes  
  sessions: {} // Date -> count
};

let currentPeriod = 'month';
let currentDate = new Date();
let currentChart = 'focus';

// Initialize insights dashboard
function initializeInsights() {
  console.log('Initializing insights dashboard...');
  loadInsightsData();
  addSampleData(); // Add some sample data for testing
  setupInsightsEventListeners();
  updateInsightsDisplay();
  console.log('Insights dashboard initialized');
}

// Add sample data for testing (remove this later)
function addSampleData() {
  // Clear existing data first
  insightsData = { focus: {}, break: {}, sessions: {} };
  
  const today = new Date();
  
  // Add data for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    // Add some random data
    insightsData.focus[dateStr] = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
    insightsData.break[dateStr] = Math.floor(Math.random() * 60) + 10; // 10-70 minutes
    insightsData.sessions[dateStr] = Math.floor(Math.random() * 5) + 1; // 1-6 sessions
  }
  
  saveInsightsData();
  console.log('Sample data added:', insightsData);
  
  // Check if elements exist
  setTimeout(() => {
    console.log('Period toggle:', document.querySelector('.insights-period-toggle'));
    console.log('Chart tabs:', document.querySelector('.insights-chart-tabs'));
    console.log('Chart container:', document.querySelector('.insights-chart-container'));
    console.log('Download button:', document.querySelector('.insights-download-btn'));
  }, 500);
}

// Load insights data from localStorage
function loadInsightsData() {
  const saved = localStorage.getItem('focusInsightsData');
  if (saved) {
    insightsData = JSON.parse(saved);
  }
}

// Save insights data to localStorage
function saveInsightsData() {
  localStorage.setItem('focusInsightsData', JSON.stringify(insightsData));
}

// Record timer data (called from timer functions)
function recordTimerData(type, minutes, isCompleted = true) {
  const today = formatDate(new Date());
  
  if (type === 'focus') {
    insightsData.focus[today] = (insightsData.focus[today] || 0) + minutes;
  } else if (type === 'break') {
    insightsData.break[today] = (insightsData.break[today] || 0) + minutes;
  } else if (type === 'session' && isCompleted) {
    insightsData.sessions[today] = (insightsData.sessions[today] || 0) + 1;
  }
  
  saveInsightsData();
  updateInsightsDisplay();
}

// Setup event listeners for insights
function setupInsightsEventListeners() {
  // Period toggle
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      updateInsightsDisplay();
    });
  });
  
  // Period navigation
  document.getElementById('period-prev')?.addEventListener('click', () => {
    if (currentPeriod === 'week') {
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    updateInsightsDisplay();
  });
  
  document.getElementById('period-next')?.addEventListener('click', () => {
    if (currentPeriod === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    updateInsightsDisplay();
  });
  
  // Chart tabs
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentChart = tab.dataset.chart;
      updateChart();
    });
  });
  
  // Download report
  document.getElementById('download-report')?.addEventListener('click', downloadReport);
}

// Update insights display
function updateInsightsDisplay() {
  console.log('Updating insights display...');
  updateStatsCards();
  updatePeriodDisplay();
  updateChart();
  console.log('Insights display updated');
}

// Update top stats cards
function updateStatsCards() {
  const { startDate, endDate } = getPeriodRange();
  
  let totalFocus = 0;
  let totalBreak = 0;
  let totalSessions = 0;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    totalFocus += insightsData.focus[dateStr] || 0;
    totalBreak += insightsData.break[dateStr] || 0;
    totalSessions += insightsData.sessions[dateStr] || 0;
  }
  
  document.getElementById('insights-focus-time').textContent = formatTimeDisplay(totalFocus);
  document.getElementById('insights-break-time').textContent = formatTimeDisplay(totalBreak);
  document.getElementById('insights-session-count').textContent = totalSessions.toString();
}

// Update period display
function updatePeriodDisplay() {
  const periodMain = document.getElementById('period-main');
  const periodSub = document.getElementById('period-sub');
  
  if (currentPeriod === 'week') {
    const { startDate, endDate } = getPeriodRange();
    const weekNum = getWeekNumber(currentDate);
    periodMain.textContent = `Week ${weekNum}`;
    periodSub.textContent = `${formatDateShort(startDate)}—${formatDateShort(endDate)}`;
  } else {
    periodMain.textContent = currentDate.toLocaleDateString('en-US', { month: 'long' });
    periodSub.textContent = '';
  }
}

// Update chart
function updateChart() {
  console.log('Updating chart...');
  const chartContainer = document.getElementById('insights-chart');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return;
  }
  
  console.log('Current period:', currentPeriod, 'Current chart:', currentChart);
  
  if (currentPeriod === 'week') {
    renderWeekChart(chartContainer);
  } else {
    renderMonthChart(chartContainer);
  }
}

// Render week chart
function renderWeekChart(container) {
  const { startDate, endDate } = getPeriodRange();
  const data = getCurrentChartData();
  const maxValue = Math.max(...Object.values(data), 1);
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  let html = '<div class="week-chart">';
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const value = data[dateStr] || 0;
    const height = (value / maxValue) * 100;
    const dayName = weekDays[d.getDay()];
    
    let timeDisplay = '';
    if (value > 0) {
      if (currentChart === 'session') {
        timeDisplay = value.toString();
      } else {
        timeDisplay = formatTimeShort(value);
      }
    }
    
    html += `
      <div class="week-bar-container">
        <div class="week-bar-time">${timeDisplay}</div>
        <div class="week-bar">
          <div class="week-bar-fill" style="height: ${height}%"></div>
        </div>
        <div class="week-bar-label">${dayName}</div>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// Render month chart
function renderMonthChart(container) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
  
  const data = getCurrentChartData();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Add day labels first
  let html = '<div class="month-labels">';
  weekDays.forEach(day => {
    html += `<div class="month-label">${day}</div>`;
  });
  html += '</div>';
  
  html += '<div class="month-chart">';
  
  // Generate calendar grid
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + (week * 7) + day);
      
      if (currentDay > lastDay && week > 4) break;
      
      const dateStr = formatDate(currentDay);
      const value = data[dateStr] || 0;
      const isCurrentMonth = currentDay.getMonth() === month;
      const hasData = value > 0 && isCurrentMonth;
      
      let timeDisplay = '';
      if (hasData) {
        if (currentChart === 'session') {
          timeDisplay = value.toString();
        } else {
          timeDisplay = formatTimeShort(value);
        }
      }
      
      html += `
        <div class="month-day ${hasData ? 'has-data' : ''}" style="opacity: ${isCurrentMonth ? 1 : 0.3}">
          ${timeDisplay ? `<div class="month-day-time">${timeDisplay}</div>` : ''}
          <div class="month-day-number">${currentDay.getDate()}</div>
        </div>
      `;
    }
  }
  
  html += '</div>';
  
  container.innerHTML = html;
}

// Get current chart data
function getCurrentChartData() {
  switch (currentChart) {
    case 'focus':
      return insightsData.focus;
    case 'break':
      return insightsData.break;
    case 'session':
      return insightsData.sessions;
    default:
      return {};
  }
}

// Get period range
function getPeriodRange() {
  if (currentPeriod === 'week') {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
    return { startDate, endDate };
  } else {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return { startDate, endDate };
  }
}

// Download report as CSV
function downloadReport() {
  const { startDate, endDate } = getPeriodRange();
  
  let csv = 'Date,Focus Time (minutes),Break Time (minutes),Sessions\n';
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const focus = insightsData.focus[dateStr] || 0;
    const breakTime = insightsData.break[dateStr] || 0;
    const sessions = insightsData.sessions[dateStr] || 0;
    
    csv += `${dateStr},${focus},${breakTime},${sessions}\n`;
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-report-${formatDate(new Date())}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeDisplay(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTimeShort(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Timer and insights initialization will be called from main DOMContentLoaded
function initializeTimerAndInsights() {
  setTimeout(() => {
    if (typeof initializeTimer === 'function') {
      initializeTimer();
    }
    if (typeof initializeInsights === 'function') {
      initializeInsights();
    }
    // Initialize navigation dropdown functionality
    initializeNavDropdowns();
  }, 100); // Small delay to ensure all elements are available
}

// Initialize navigation dropdown functionality
function initializeNavDropdowns() {
  const leftNavBtn = document.getElementById('left-nav-btn');
  const rightNavBtn = document.getElementById('right-nav-btn');
  const leftDropdownMenu = document.getElementById('left-dropdown-menu');
  const rightDropdownMenu = document.getElementById('right-dropdown-menu');

  // Populate dropdown menus with content
  populateDropdownMenus();

  // Left dropdown (Plus+)
  if (leftNavBtn && leftDropdownMenu) {
    leftNavBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Close right dropdown if open
      const rightDropdown = document.getElementById('right-dropdown');
      if (rightDropdown) {
        rightDropdown.classList.remove('active');
      }
      
      // Toggle left dropdown
      const leftDropdown = document.getElementById('left-dropdown');
      if (leftDropdown) {
        leftDropdown.classList.toggle('active');
      }
    });
  }

  // Right dropdown (More)
  if (rightNavBtn && rightDropdownMenu) {
    rightNavBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Close left dropdown if open
      const leftDropdown = document.getElementById('left-dropdown');
      if (leftDropdown) {
        leftDropdown.classList.remove('active');
      }
      
      // Toggle right dropdown
      const rightDropdown = document.getElementById('right-dropdown');
      if (rightDropdown) {
        rightDropdown.classList.toggle('active');
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      const leftDropdown = document.getElementById('left-dropdown');
      const rightDropdown = document.getElementById('right-dropdown');
      if (leftDropdown) leftDropdown.classList.remove('active');
      if (rightDropdown) rightDropdown.classList.remove('active');
    }
  });
}

// Populate dropdown menus with content
function populateDropdownMenus() {
  const leftDropdownMenu = document.getElementById('left-dropdown-menu');
  const rightDropdownMenu = document.getElementById('right-dropdown-menu');

  // Left dropdown (Plus+) menu items
  if (leftDropdownMenu) {
    leftDropdownMenu.innerHTML = `
      <div class="dropdown-item" data-action="upgrade">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Upgrade to Pro</span>
      </div>
      <div class="dropdown-item" data-action="login">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Sign In</span>
      </div>
      <div class="dropdown-item" data-action="signup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M23 11H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Create Account</span>
      </div>
    `;

    // Add event listeners for left dropdown items
    leftDropdownMenu.addEventListener('click', function(e) {
      const dropdownItem = e.target.closest('.dropdown-item');
      if (dropdownItem) {
        const action = dropdownItem.getAttribute('data-action');
        handleLeftDropdownAction(action);
        leftDropdownMenu.classList.remove('active');
      }
    });
  }

  // Right dropdown (More) menu items
  if (rightDropdownMenu) {
    rightDropdownMenu.innerHTML = `
      <div class="dropdown-item" data-action="stats">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11H7a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2zM21 11h-2a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2zM15 3h-2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Stats</span>
      </div>
      <div class="dropdown-item" data-action="todo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 12V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Todo</span>
      </div>
    `;

    // Add event listeners for right dropdown items
    rightDropdownMenu.addEventListener('click', function(e) {
      const dropdownItem = e.target.closest('.dropdown-item');
      if (dropdownItem) {
        const action = dropdownItem.getAttribute('data-action');
        handleRightDropdownAction(action);
        rightDropdownMenu.classList.remove('active');
      }
    });
  }
}

// Handle left dropdown actions
function handleLeftDropdownAction(action) {
  switch(action) {
    case 'upgrade':
      // Open pricing modal
      const pricingModal = document.getElementById('pricing-modal');
      if (pricingModal) {
        pricingModal.classList.remove('hidden');
        pricingModal.style.display = 'flex';
        // Apply glass effect styling
        applyGlassPricingModalStyles();
        // Initialize pricing modal functionality
        initializePricingModal();
        // Apply compact styling to pricing options
        applyCompactPricingStyles();
      }
      break;
    case 'login':
      // Open auth modal in login mode
      const authModal = document.getElementById('auth-modal');
      if (authModal) {
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
        // Set to login mode if needed
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
          signupBtn.textContent = 'Sign In';
        }
      }
      break;
    case 'signup':
      // Open auth modal in signup mode  
      const signupModal = document.getElementById('auth-modal');
      if (signupModal) {
        signupModal.classList.remove('hidden');
        signupModal.style.display = 'flex';
        // Set to signup mode
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
          signupBtn.textContent = 'Pay $100.99 & Sign up';
        }
      }
      break;
  }
}

// Handle right dropdown actions
function handleRightDropdownAction(action) {
  switch(action) {
    case 'stats':
      // Directly open stats modal
      const statsModal = document.getElementById('stats-modal');
      if (statsModal) {
        // Close any open bottom sheets first
        if (typeof closeAllBottomSheets === 'function') {
          closeAllBottomSheets();
        }
        
        // Open stats modal
        statsModal.classList.remove('hidden');
        requestAnimationFrame(() => {
          statsModal.classList.add('active');
        });
      }
      break;
    case 'todo':
      // Trigger the existing todo functionality
      const openTodoBtn = document.getElementById('open-todo-btn');
      if (openTodoBtn) {
        openTodoBtn.click();
      } else {
        // Fallback: directly open todo sheet
        const todoSheet = document.getElementById('todo-sheet');
        if (todoSheet) {
          if (typeof closeAllBottomSheets === 'function') closeAllBottomSheets();
          todoSheet.classList.remove('hidden');
          requestAnimationFrame(() => {
            todoSheet.classList.add('active');
          });
        }
      }
      break;
  }
}

// Initialize pricing modal functionality
function initializePricingModal() {
  const pricingOptions = document.querySelectorAll('.pricing-option');
  const actionBtn = document.getElementById('pricing-action-btn');
  const closeBtn = document.getElementById('close-pricing-modal');
  
  // Plan pricing data with Creem.io product IDs
  const planPricing = {
    monthly: { 
      price: '10.99', 
      period: 'month',
      productId: 'your_monthly_product_id', // Replace with actual Creem.io product ID
      planName: 'Monthly Plan'
    },
    yearly: { 
      price: '100.99', 
      period: 'year',
      productId: 'your_yearly_product_id', // Replace with actual Creem.io product ID
      planName: 'Yearly Plan'
    },
    lifetime: { 
      price: '299.99', 
      period: 'one-time',
      productId: 'your_lifetime_product_id', // Replace with actual Creem.io product ID
      planName: 'Lifetime Plan'
    }
  };
  
  // Store selected plan globally
  window.selectedPlan = null;
  
  // Handle plan selection
  pricingOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove selected class from all options
      pricingOptions.forEach(opt => {
        opt.classList.remove('selected');
        opt.style.border = '2px solid rgba(255, 255, 255, 0.1)';
        opt.style.background = 'rgba(255, 255, 255, 0.05)';
        
        const checkbox = opt.querySelector('.pricing-checkbox');
        if (checkbox) {
          checkbox.classList.remove('selected');
          checkbox.style.border = '2px solid rgba(255, 255, 255, 0.3)';
          checkbox.style.background = 'transparent';
          checkbox.innerHTML = '';
        }
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      this.style.border = '2px solid #ff4757';
      this.style.background = 'rgba(255, 71, 87, 0.1)';
      
      const checkbox = this.querySelector('.pricing-checkbox');
      if (checkbox) {
        checkbox.classList.add('selected');
        checkbox.style.border = '2px solid #ff4757';
        checkbox.style.background = '#ff4757';
        checkbox.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }
      
      // Update button text and store selected plan
      const plan = this.getAttribute('data-plan');
      const pricing = planPricing[plan];
      if (actionBtn && pricing) {
        // Store selected plan globally
        window.selectedPlan = {
          plan: plan,
          ...pricing
        };
        
        if (plan === 'lifetime') {
          actionBtn.textContent = `Pay $${pricing.price} & Sign up`;
        } else {
          actionBtn.textContent = `Pay $${pricing.price}/${pricing.period} & Sign up`;
        }
      }
    });
  });
  
  // Close modal functionality
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      const pricingModal = document.getElementById('pricing-modal');
      if (pricingModal) {
        pricingModal.classList.add('hidden');
        pricingModal.style.display = 'none';
      }
    });
  }
  
  // Close modal when clicking outside
  const pricingModal = document.getElementById('pricing-modal');
  if (pricingModal) {
    pricingModal.addEventListener('click', function(e) {
      if (e.target === pricingModal) {
        pricingModal.classList.add('hidden');
        pricingModal.style.display = 'none';
      }
    });
  }
  
  // Set initial button text and selected plan based on default selection
  const selectedOption = document.querySelector('.pricing-option.selected');
  if (selectedOption && actionBtn) {
    const plan = selectedOption.getAttribute('data-plan');
    const pricing = planPricing[plan];
    if (pricing) {
      // Store default selected plan
      window.selectedPlan = {
        plan: plan,
        ...pricing
      };
      
      if (plan === 'lifetime') {
        actionBtn.textContent = `Pay $${pricing.price} & Sign up`;
      } else {
        actionBtn.textContent = `Pay $${pricing.price}/${pricing.period} & Sign up`;
      }
    }
  }
  
  // Handle pay button click - open auth modal
  if (actionBtn) {
    actionBtn.addEventListener('click', function() {
      // Close pricing modal
      const pricingModal = document.getElementById('pricing-modal');
      if (pricingModal) {
        pricingModal.classList.add('hidden');
        pricingModal.style.display = 'none';
      }
      
      // Open auth modal for signup
      const authModal = document.getElementById('auth-modal');
      if (authModal) {
        // Remove hidden class and show modal
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
        authModal.style.alignItems = 'center';
        authModal.style.justifyContent = 'center';
        
        // Ensure modal is visible with proper z-index
        authModal.style.position = 'fixed';
        authModal.style.top = '0';
        authModal.style.left = '0';
        authModal.style.width = '100vw';
        authModal.style.height = '100vh';
        authModal.style.background = 'rgba(0,0,0,0.5)';
        authModal.style.zIndex = '9999';
        
        // Ensure the glass panel inside is visible
        const glassPanel = authModal.querySelector('.glass-panel');
        if (glassPanel) {
          glassPanel.style.display = 'block';
          glassPanel.style.position = 'relative';
          glassPanel.style.zIndex = '10000';
        }
        
        // Update signup button text with selected plan
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn && window.selectedPlan) {
          signupBtn.textContent = `Create Account & Pay $${window.selectedPlan.price}`;
        }
        
        // Clear any existing error messages
        const errorMessage = document.getElementById('auth-error-message');
        if (errorMessage) {
          errorMessage.textContent = '';
          errorMessage.style.display = 'none';
        }
        
        // Initialize auth modal functionality
        initializeAuthModal();
      }
    });
  }
}

// Initialize auth modal functionality
function initializeAuthModal() {
  const authForm = document.getElementById('auth-form');
  const signupBtn = document.getElementById('signup-btn');
  const closeBtn = document.getElementById('close-auth-modal');
  const errorMessage = document.getElementById('auth-error-message');
  
  // Close modal functionality
  if (closeBtn) {
    closeBtn.removeEventListener('click', closeAuthModal); // Remove existing listener
    closeBtn.addEventListener('click', closeAuthModal);
  }
  
  // Close modal when clicking outside
  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.removeEventListener('click', handleAuthModalOutsideClick); // Remove existing listener
    authModal.addEventListener('click', handleAuthModalOutsideClick);
  }
  
  // Close modal functions
  function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.classList.add('hidden');
      authModal.style.display = 'none';
    }
  }
  
  function handleAuthModalOutsideClick(e) {
    const authModal = document.getElementById('auth-modal');
    if (e.target === authModal) {
      closeAuthModal();
    }
  }
  
  // Handle signup form submission
  if (signupBtn) {
    signupBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      
      // Validate inputs
      if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
      }
      
      if (!isValidEmail(email)) {
        showAuthError('Please enter a valid email address');
        return;
      }
      
      if (password.length < 6) {
        showAuthError('Password must be at least 6 characters long');
        return;
      }
      
      if (!window.selectedPlan) {
        showAuthError('Please select a plan first');
        return;
      }
      
      // Show loading state
      signupBtn.textContent = 'Creating Account...';
      signupBtn.disabled = true;
      
      try {
        // Create Supabase account
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        
        if (error) {
          throw error;
        }
        
        // If account created successfully, launch Creem checkout
        if (data.user) {
          // Close auth modal
          authModal.classList.add('hidden');
          authModal.style.display = 'none';
          
          // Launch Creem.io checkout
          launchCreemCheckout(email, window.selectedPlan);
        }
        
      } catch (error) {
        console.error('Signup error:', error);
        showAuthError(error.message || 'Failed to create account. Please try again.');
        
        // Reset button state
        if (window.selectedPlan) {
          signupBtn.textContent = `Create Account & Pay $${window.selectedPlan.price}`;
        }
        signupBtn.disabled = false;
      }
    });
  }
  
  // Helper function to show auth errors
  function showAuthError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }
  }
  
  // Helper function to validate email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Launch Creem.io checkout
function launchCreemCheckout(email, selectedPlan) {
  try {
    // Replace with your actual Creem.io configuration
    const creemConfig = {
      publicKey: 'your_creem_public_key', // Replace with your Creem.io public key
      productId: selectedPlan.productId,
      customerEmail: email,
      amount: parseFloat(selectedPlan.price) * 100, // Convert to cents
      currency: 'USD',
      planName: selectedPlan.planName,
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel',
      metadata: {
        plan: selectedPlan.plan,
        period: selectedPlan.period,
        userId: email // You can also use Supabase user ID here
      }
    };
    
    // Launch Creem checkout
    // Note: Replace this with actual Creem.io SDK integration
    if (window.Creem) {
      window.Creem.checkout(creemConfig);
    } else {
      // Fallback: redirect to Creem checkout URL
      const checkoutUrl = `https://checkout.creem.io/pay?` + 
        `publicKey=${encodeURIComponent(creemConfig.publicKey)}&` +
        `productId=${encodeURIComponent(creemConfig.productId)}&` +
        `email=${encodeURIComponent(email)}&` +
        `amount=${creemConfig.amount}&` +
        `currency=${creemConfig.currency}`;
      
      window.location.href = checkoutUrl;
    }
    
  } catch (error) {
    console.error('Creem checkout error:', error);
    alert('Failed to launch payment. Please try again.');
  }
}

// Apply glass effect styling to pricing modal
function applyGlassPricingModalStyles() {
  const pricingModal = document.getElementById('pricing-modal');
  const pricingPanel = pricingModal?.querySelector('.pricing-panel');
  
  if (pricingPanel) {
    // Apply glassmorphism effect
    pricingPanel.style.background = 'rgba(255, 255, 255, 0.1)';
    pricingPanel.style.backdropFilter = 'blur(20px)';
    pricingPanel.style.webkitBackdropFilter = 'blur(20px)';
    pricingPanel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    pricingPanel.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    
    // Remove the blue gradient background
    pricingPanel.style.backgroundImage = 'none';
  }
}

// Apply compact styling to pricing options
function applyCompactPricingStyles() {
  const pricingOptions = document.querySelectorAll('.pricing-option');
  const pricingContainer = document.querySelector('.pricing-options');
  
  // Make container more compact
  if (pricingContainer) {
    pricingContainer.style.marginBottom = '1.5em';
  }
  
  pricingOptions.forEach(option => {
    // Reduce padding and margins
    option.style.padding = '0.6em 0.8em';
    option.style.marginBottom = '0.5em';
    option.style.borderRadius = '8px';
    
    // Make checkbox smaller
    const checkbox = option.querySelector('.pricing-checkbox');
    if (checkbox) {
      checkbox.style.width = '16px';
      checkbox.style.height = '16px';
      checkbox.style.borderRadius = '3px';
      
      // Adjust checkmark size if it exists
      const svg = checkbox.querySelector('svg');
      if (svg) {
        svg.style.width = '10px';
        svg.style.height = '10px';
      }
    }
    
    // Adjust pricing info spacing and font sizes
    const pricingInfo = option.querySelector('.pricing-info');
    if (pricingInfo) {
      pricingInfo.style.marginLeft = '0.8em';
      
      // Make plan name smaller
      const planName = pricingInfo.children[0];
      if (planName) {
        planName.style.fontSize = '1em';
        planName.style.fontWeight = '500';
        planName.style.marginBottom = '2px';
      }
      
      // Make price smaller
      const planPrice = pricingInfo.children[1];
      if (planPrice) {
        planPrice.style.fontSize = '0.85em';
      }
    }
    
    // Adjust best value badge
    const badge = option.querySelector('.best-value-badge');
    if (badge) {
      badge.style.fontSize = '0.65em';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '6px';
      badge.style.top = '-6px';
      badge.style.right = '8px';
    }
  });
}

// Add cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Comprehensive audio cleanup
  cleanupAllAudio();
  
  // Timer interval cleanup
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Save incomplete session
  if (state.sessionStartTime) {
    endSession();
  }
});
  
  
  