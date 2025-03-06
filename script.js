document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    const featureScreens = document.querySelectorAll('.feature-screen');
    const baseFeatureMatrix = document.querySelector('a[data-feature="baseFeatureMatrix"]');
    const allFeaturesLink = document.querySelector('a[data-feature="allFeatures"]');
    const featureSearch = document.getElementById('featureSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const categoryFilter = document.getElementById('categoryFilter');
    const clientFilter = document.getElementById('clientFilter');
    const downloadBtn = document.getElementById('downloadReport');

    // Initially hide the All Features option
    allFeaturesLink.parentElement.style.display = 'none';

    // Navigation functionality
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle dropdown for Base Feature Matrix
            if (link === baseFeatureMatrix) {
                link.classList.toggle('active');
                allFeaturesLink.parentElement.style.display = link.classList.contains('active') ? 'block' : 'none';
                return;
            }

            // Show All Features screen
            if (link === allFeaturesLink) {
                featureScreens.forEach(screen => screen.classList.remove('active'));
                document.getElementById('allFeatures').classList.add('active');
                document.getElementById('baseFeatureMatrix').classList.remove('active');
            }
        });
    });

    // Get all features and their categories
    function getAllFeatures() {
        const features = [];
        document.querySelectorAll('.feature-matrix tr').forEach(row => {
            if (!row.classList.contains('category-header')) {
                const featureCell = row.querySelector('td');
                if (featureCell) {
                    const categoryHeader = row.closest('tbody').querySelector('.category-header');
                    features.push({
                        name: featureCell.textContent.trim(),
                        category: categoryHeader ? categoryHeader.textContent.trim() : '',
                        element: row
                    });
                }
            }
        });
        return features;
    }

    // Search and Suggestions functionality
    const featuresList = getAllFeatures();
    let currentSuggestionIndex = -1;

    function showSearchSuggestions(searchTerm) {
        if (!searchTerm) {
            searchSuggestions.style.display = 'none';
            return;
        }

        const matchingFeatures = featuresList.filter(feature => 
            feature.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions

        if (matchingFeatures.length > 0) {
            searchSuggestions.innerHTML = matchingFeatures.map((feature, index) => `
                <div class="search-suggestion-item" data-index="${index}">
                    <span>${feature.name}</span>
                    <span class="category-label">${feature.category}</span>
                </div>
            `).join('');
            searchSuggestions.style.display = 'block';

            // Add click handlers to suggestions
            document.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index'));
                    selectFeature(matchingFeatures[index]);
                });
            });
        } else {
            searchSuggestions.style.display = 'none';
        }
    }

    function selectFeature(feature) {
        featureSearch.value = feature.name;
        searchSuggestions.style.display = 'none';
        highlightAndScrollToFeature(feature.element);
        filterFeatures(); // Update table filtering
    }

    function highlightAndScrollToFeature(element) {
        // Remove highlight from any previously highlighted row
        document.querySelectorAll('.feature-highlight').forEach(row => {
            row.classList.remove('feature-highlight');
        });

        // Add highlight to the selected row
        element.classList.add('feature-highlight');

        // Scroll the row into view
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // Remove highlight after animation
        setTimeout(() => {
            element.classList.remove('feature-highlight');
        }, 1000);
    }

    // Search input event handlers
    featureSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        showSearchSuggestions(searchTerm);
        filterFeatures();
    });

    featureSearch.addEventListener('keydown', (e) => {
        const suggestions = document.querySelectorAll('.search-suggestion-item');
        
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
                updateSuggestionHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, 0);
                updateSuggestionHighlight();
            } else if (e.key === 'Enter' && currentSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedFeature = featuresList.filter(feature => 
                    feature.name.toLowerCase().includes(featureSearch.value.toLowerCase())
                )[currentSuggestionIndex];
                if (selectedFeature) {
                    selectFeature(selectedFeature);
                }
            } else if (e.key === 'Escape') {
                searchSuggestions.style.display = 'none';
                currentSuggestionIndex = -1;
            }
        }
    });

    function updateSuggestionHighlight() {
        document.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchSuggestions.style.display = 'none';
            currentSuggestionIndex = -1;
        }
    });

    // Filter functionality
    function filterFeatures() {
        const searchTerm = featureSearch.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedClient = clientFilter.value;
        const featureRows = document.querySelectorAll('.feature-matrix tr');

        // Hide all rows initially
        featureRows.forEach(row => {
            row.style.display = 'none';
            // Remove any existing search highlights
            row.classList.remove('search-highlight');
        });

        // Show header row
        document.querySelector('.feature-matrix thead tr').style.display = '';

        let currentCategory = '';
        let showCurrentCategory = false;

        featureRows.forEach(row => {
            if (row.classList.contains('category-header')) {
                currentCategory = row.querySelector('td').textContent.trim();
                showCurrentCategory = !selectedCategory || currentCategory === selectedCategory;
                if (showCurrentCategory) {
                    row.style.display = '';
                }
            } else {
                const featureCell = row.querySelector('td:first-child');
                if (!featureCell) return;

                const featureName = featureCell.textContent.toLowerCase();
                const rowCategory = row.getAttribute('data-category');
                const hasSelectedClient = selectedClient ? row.querySelector(`td:nth-child(${getClientColumnIndex(selectedClient)})`).textContent.trim() === 'x' : true;

                // Only apply category and client filters for visibility
                const matchesCategory = !selectedCategory || rowCategory === selectedCategory;
                
                if (matchesCategory && hasSelectedClient) {
                    row.style.display = '';
                    // Apply search highlight if there's a search term and it matches
                    if (searchTerm && featureName.includes(searchTerm)) {
                        row.classList.add('search-highlight');
                    }
                }
            }
        });
    }

    function getClientColumnIndex(clientName) {
        const headers = document.querySelectorAll('.feature-matrix th');
        let index = 1;
        headers.forEach((header, i) => {
            if (header.textContent.toLowerCase().includes(clientName.toLowerCase())) {
                index = i + 1;
            }
        });
        return index;
    }

    categoryFilter.addEventListener('change', filterFeatures);
    clientFilter.addEventListener('change', filterFeatures);

    // Download report functionality
    downloadBtn.addEventListener('click', () => {
        const rows = [];
        const headers = ['Feature', 'Category'];
        
        // Get client names for headers
        document.querySelectorAll('.feature-matrix th').forEach((th, index) => {
            if (index > 0) headers.push(th.textContent);
        });
        rows.push(headers);

        // Get feature data
        let currentCategory = '';
        document.querySelectorAll('.feature-matrix tr').forEach(row => {
            if (row.classList.contains('category-header')) {
                currentCategory = row.textContent.trim();
            } else if (!row.classList.contains('category-header') && row.querySelector('td')) {
                const featureData = [];
                featureData.push(row.querySelector('td').textContent.trim());
                featureData.push(currentCategory);
                
                // Get client data
                row.querySelectorAll('td').forEach((td, index) => {
                    if (index > 0) featureData.push(td.textContent.trim() || '-');
                });
                
                rows.push(featureData);
            }
        });

        // Convert to CSV
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'orderpointe_features.csv';
        link.click();
    });
});
