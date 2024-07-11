import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

// Factory function to create a book preview manager
function createBookPreviewManager() {
    function createPreviewElement(book) {
        const { author, id, image, title } = book;
        const element = document.createElement('button');
        element.classList = 'preview';
        element.setAttribute('data-preview', id);
        element.innerHTML = `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `;
        return element;
    }
// 
    function updatePreviewElement(element, book) {
        const { author, image, title } = book;
        element.querySelector('.preview__image').src = image;
        element.querySelector('.preview__title').innerText = title;
        element.querySelector('.preview__author').innerText = authors[author];
    }

    function renderPreviewList(container, books, page, booksPerPage) {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const itemsToShow = books.slice(0, booksPerPage * page);
        for (const book of itemsToShow) {
            const element = createPreviewElement(book);
            fragment.appendChild(element);
        }
        container.appendChild(fragment);
    }

    function updateListButton(button, matches, page, booksPerPage) {
        const remaining = Math.max(0, matches.length - booksPerPage * page);
        const buttonText = remaining > 0 ? `Show more (${remaining})` : 'No more books';
        button.innerHTML = `<span>Show more</span><span class="list__remaining">${buttonText}</span>`;
        button.disabled = remaining === 0;
    }

    return {
        createPreviewElement,
        updatePreviewElement,
        renderPreviewList,
        updateListButton
    };
}

// Initialize application
function init() {
    const bookPreviewManager = createBookPreviewManager();
    let page = 1;
    let matches = books;

    const listItemsContainer = document.querySelector('[data-list-items]');
    const listButton = document.querySelector('[data-list-button]');

    // Initial render
    bookPreviewManager.renderPreviewList(listItemsContainer, matches, page, BOOKS_PER_PAGE);
    bookPreviewManager.updateListButton(listButton, matches, page, BOOKS_PER_PAGE);

    // Handle "Show more" button click
    listButton.addEventListener('click', () => {
        page++;
        bookPreviewManager.renderPreviewList(listItemsContainer, matches, page, BOOKS_PER_PAGE);
        bookPreviewManager.updateListButton(listButton, matches, page, BOOKS_PER_PAGE);
    });

    // Populate genre dropdown
    const genreDropdown = document.querySelector('[data-search-genres]');
    const genreOptions = Object.entries(genres).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
    genreDropdown.innerHTML = `<option value="any">All Genres</option>${genreOptions}`;

    // Populate author dropdown
    const authorDropdown = document.querySelector('[data-search-authors]');
    const authorOptions = Object.entries(authors).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
    authorDropdown.innerHTML = `<option value="any">All Authors</option>${authorOptions}`;

    // Set initial theme
    const preferredTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    setTheme(preferredTheme);

    // Set up event listeners
    setupEventListeners(bookPreviewManager, matches, listItemsContainer, listButton);

    // Initial list button text and disabled state
    updateListDisplay(bookPreviewManager, matches, page, BOOKS_PER_PAGE, listItemsContainer, listButton);
}

// Function to set theme
function setTheme(theme) {
    const colorDark = theme === 'night' ? '255, 255, 255' : '10, 10, 20';
    const colorLight = theme === 'night' ? '10, 10, 20' : '255, 255, 255';
    document.documentElement.style.setProperty('--color-dark', colorDark);
    document.documentElement.style.setProperty('--color-light', colorLight);
}

// Function to handle form submission
function handleFormSubmission(formSelector, dataSelector, callback) {
    document.querySelector(formSelector).addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const filters = Object.fromEntries(formData);
        callback(filters);
        document.querySelector(dataSelector).open = false;
    });
}

// Function to update the list based on filters
function updateList(filters, matches, books, page, booksPerPage, bookPreviewManager, listItemsContainer, listButton) {
    const result = books.filter(book => {
        let genreMatch = filters.genre === 'any';
        for (const singleGenre of book.genres) {
            if (genreMatch) break;
            if (singleGenre === filters.genre) { genreMatch = true; }
        }
        return (
            (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
            (filters.author === 'any' || book.author === filters.author) &&
            genreMatch
        );
    });
    page = 1;
    matches = result;
    bookPreviewManager.renderPreviewList(listItemsContainer, matches, page, booksPerPage);
    bookPreviewManager.updateListButton(listButton, matches, page, booksPerPage);
}

// Function to set up event listeners
function setupEventListeners(bookPreviewManager, matches, listItemsContainer, listButton) {
    handleFormSubmission('[data-search-form]', '[data-search-overlay]', (filters) => {
        updateList(filters, matches, books, 1, BOOKS_PER_PAGE, bookPreviewManager, listItemsContainer, listButton);
    });

    handleFormSubmission('[data-settings-form]', '[data-settings-overlay]', (settings) => {
        setTheme(settings.theme);
    });
    
    document.querySelector('[data-search-cancel]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = false;
    });
    document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = false;
    });
    document.querySelector('[data-header-search]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = true;
        document.querySelector('[data-search-title]').focus();
    });
    document.querySelector('[data-header-settings]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = true;
    });
    document.querySelector('[data-list-close]').addEventListener('click', () => {
        document.querySelector('[data-list-active]').open = false;
    });
    
    document.querySelector('[data-list-items]').addEventListener('click', (event) => {
        const target = event.target.closest('.preview');
        if (!target) return;
        const activeBook = books.find(book => book.id === target.dataset.preview);
        if (activeBook) {
            document.querySelector('[data-list-active]').open = true;
            document.querySelector('[data-list-blur]').src = activeBook.image;
            document.querySelector('[data-list-image]').src = activeBook.image;
            document.querySelector('[data-list-title]').innerText = activeBook.title;
            document.querySelector('[data-list-subtitle]').innerText = `${authors[activeBook.author]} (${new Date(activeBook.published).getFullYear()})`;
            document.querySelector('[data-list-description]').innerText = activeBook.description;
        }
    });
}

// Function to update list display
function updateListDisplay(bookPreviewManager, matches, page, booksPerPage, listItemsContainer, listButton) {
    bookPreviewManager.renderPreviewList(listItemsContainer, matches, page, booksPerPage);
    bookPreviewManager.updateListButton(listButton, matches, page, booksPerPage);
}

// Initialize the application
init();

/**
 * The function `createBookPreviewManager` can be considered a factory function because:
 * - It encapsulates the logic for creating a book preview element within `createPreviewElement`.
 * - It provides flexibility by returning an object containing `createPreviewElement`, allowing the creation of multiple preview elements.
 * - It avoids the use of the `new` keyword by using `document.createElement`.
 * - It improves code readability and maintenance by modularizing the preview element creation logic.
 * - It promotes reuse by enabling the creation of preview elements for different books.
 */

