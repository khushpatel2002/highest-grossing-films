// Global variables to store the original and filtered data
let filmsData = [];
let filteredData = [];
let activeFilters = {
    years: new Set(),
    countries: new Set(),
    directors: new Set()
};

// DOM Elements
const filmsContainer = document.getElementById('filmsContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const yearFilters = document.getElementById('yearFilters');
const countryFilters = document.getElementById('countryFilters');
const directorFilters = document.getElementById('directorFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const totalFilmsElement = document.getElementById('totalFilms');
const avgBoxOfficeElement = document.getElementById('avgBoxOffice');
const yearRangeElement = document.getElementById('yearRange');

// Fetch and load the film data
async function loadFilmsData() {
    try {
        console.log('Fetching films data...');
        const response = await fetch('films_data.json');
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        filmsData = await response.json();
        console.log('Films data loaded:', filmsData);
        filteredData = [...filmsData];
        
        // Initialize filters
        initializeFilters();
        updateStats();
        displayFilms();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading films data:', error);
        filmsContainer.innerHTML = '<p class="error">Error loading films data. Please try again later.</p>';
    }
}

// Initialize filter options
function initializeFilters() {
    // Get unique years, countries, and directors
    const years = new Set(filmsData.map(film => film.release_year).sort((a, b) => b - a));
    const countries = new Set(filmsData.map(film => film.country).filter(Boolean));
    const directors = new Set(filmsData.map(film => film.directors).filter(Boolean));

    // Create filter options
    yearFilters.innerHTML = Array.from(years)
        .map(year => createFilterOption('year', year))
        .join('');
    
    countryFilters.innerHTML = Array.from(countries)
        .sort()
        .map(country => createFilterOption('country', country))
        .join('');
    
    directorFilters.innerHTML = Array.from(directors)
        .sort()
        .map(director => createFilterOption('director', director))
        .join('');
}

// Create a filter option element
function createFilterOption(type, value) {
    return `
        <div class="filter-option" data-type="${type}" data-value="${value}">
            <span>${value}</span>
            <span class="count">(${countFilmsByFilter(type, value)})</span>
        </div>
    `;
}

// Count films for a specific filter
function countFilmsByFilter(type, value) {
    return filmsData.filter(film => {
        switch(type) {
            case 'year': return film.release_year === value;
            case 'country': return film.country === value;
            case 'director': return film.directors === value;
            default: return false;
        }
    }).length;
}

// Format currency for display
function formatCurrency(value) {
    if (typeof value === 'string') {
        value = value.replace(/[$,]/g, '');
    }
    const number = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(number);
}

// Create HTML for a single film card
function createFilmCard(film) {
    return `
        <a href="${film.film_url}" target="_blank" class="film-card-link">
            <div class="film-card">
                ${film.image_url ? 
                    `<img src="${film.image_url}" alt="${film.title}" class="film-image">` :
                    `<div class="film-image" style="background-color: #2b2b2b;"></div>`
                }
                <div class="film-info">
                    <h2 class="film-title">${film.title}</h2>
                    <div class="film-details">
                        <p><i class="fas fa-calendar"></i> ${film.release_year}</p>
                        <p><i class="fas fa-dollar-sign"></i> ${film.box_office}</p>
                        ${film.directors ? `<p><i class="fas fa-video"></i> ${film.directors}</p>` : ''}
                        ${film.country ? `<p><i class="fas fa-globe"></i> ${film.country}</p>` : ''}
                    </div>
                </div>
            </div>
        </a>
    `;
}

// Display films in the container
function displayFilms() {
    filmsContainer.innerHTML = filteredData.map(film => createFilmCard(film)).join('');
}

// Update statistics
function updateStats() {
    // Update total films count
    totalFilmsElement.textContent = filteredData.length;

    // Calculate and update average box office
    const totalBoxOffice = filteredData.reduce((sum, film) => {
        const value = parseFloat(film.box_office.replace(/[$,]/g, ''));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);
    const averageBoxOffice = totalBoxOffice / filteredData.length;
    avgBoxOfficeElement.textContent = formatCurrency(averageBoxOffice);

    // Update year range
    const years = filteredData.map(film => film.release_year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    yearRangeElement.textContent = `${minYear} - ${maxYear}`;
}

// Apply all filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();

    filteredData = filmsData.filter(film => {
        // Search filter
        const matchesSearch = film.title.toLowerCase().includes(searchTerm) ||
                            (film.directors && film.directors.toLowerCase().includes(searchTerm));

        // Year filter
        const matchesYear = activeFilters.years.size === 0 || 
                          activeFilters.years.has(film.release_year);

        // Country filter
        const matchesCountry = activeFilters.countries.size === 0 || 
                             (film.country && activeFilters.countries.has(film.country));

        // Director filter
        const matchesDirector = activeFilters.directors.size === 0 || 
                              (film.directors && activeFilters.directors.has(film.directors));

        return matchesSearch && matchesYear && matchesCountry && matchesDirector;
    });

    sortFilms();
    updateStats();
    displayFilms();
}

// Sort films based on selected criteria
function sortFilms() {
    const sortBy = sortSelect.value;
    
    filteredData.sort((a, b) => {
        switch (sortBy) {
            case 'boxOffice':
                return parseFloat(b.box_office.replace(/[$,]/g, '')) - 
                       parseFloat(a.box_office.replace(/[$,]/g, ''));
            case 'boxOfficeAsc':
                return parseFloat(a.box_office.replace(/[$,]/g, '')) - 
                       parseFloat(b.box_office.replace(/[$,]/g, ''));
            case 'yearDesc':
                return b.release_year - a.release_year;
            case 'yearAsc':
                return a.release_year - b.release_year;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
}

// Toggle filter option
function toggleFilterOption(element) {
    const type = element.dataset.type;
    const value = element.dataset.value;
    const filterSet = type === 'year' ? activeFilters.years :
                     type === 'country' ? activeFilters.countries :
                     activeFilters.directors;

    element.classList.toggle('active');
    
    if (element.classList.contains('active')) {
        filterSet.add(type === 'year' ? parseInt(value) : value);
    } else {
        filterSet.delete(type === 'year' ? parseInt(value) : value);
    }

    applyFilters();
}

// Reset all filters
function resetFilters() {
    // Clear active filters
    activeFilters.years.clear();
    activeFilters.countries.clear();
    activeFilters.directors.clear();

    // Reset UI
    searchInput.value = '';
    sortSelect.value = 'boxOffice';
    document.querySelectorAll('.filter-option').forEach(option => {
        option.classList.remove('active');
    });

    // Reset data and update UI
    filteredData = [...filmsData];
    sortFilms();
    updateStats();
    displayFilms();
}

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Add click events to filter options
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => toggleFilterOption(option));
    });
}

// Initialize the application
loadFilmsData();
