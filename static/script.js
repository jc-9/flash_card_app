document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const managementSection = document.getElementById('management-section');
    const paramsSection = document.getElementById('params-section');
    const flashcardSection = document.getElementById('flashcard-section');
    const resultsSection = document.getElementById('results-section');
    const overallStatsSection = document.getElementById('overall-stats-section');

    const csvUploadForm = document.getElementById('csv-upload-form');
    const uploadMessage = document.getElementById('upload-message');
    const numWordsInput = document.getElementById('num-words');
    const startTestBtn = document.getElementById('start-test-btn');
    const currentWordDisplay = document.getElementById('current-word');
    // const pronounceBtn = document.getElementById('pronounce-btn'); // Removed this button
    const correctBtn = document.getElementById('correct-btn');
    const incorrectBtn = document.getElementById('incorrect-btn');
    const wordCounter = document.getElementById('word-counter');
    const resultsCorrect = document.getElementById('results-correct');
    const resultsIncorrect = document.getElementById('results-incorrect');
    const resultsPercentage = document.getElementById('results-percentage');
    const restartTestBtn = document.getElementById('restart-test-btn');
    const viewOverallStatsBtn = document.getElementById('view-overall-stats-btn');
    const overallCorrect = document.getElementById('overall-correct');
    const overallIncorrect = document.getElementById('overall-incorrect');
    const overallPercentage = document.getElementById('overall-percentage');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const wordListTableBody = document.querySelector('#word-list-table tbody');
    const refreshWordsBtn = document.getElementById('refresh-words-btn');
    const goToTestParamsBtn = document.getElementById('go-to-test-params-btn'); // New element reference

    // Custom Modal Elements
    const customModal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalInput = document.getElementById('modal-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const closeModalBtn = document.querySelector('.close-button');


    // State Variables
    let currentWord = null;
    let wordsToTest = [];
    let sessionCorrect = 0;
    let sessionIncorrect = 0;
    let currentWordIndex = 0;
    let totalWordsInTest = 0;

    // Sound effects using Tone.js
    const correctSound = new Tone.MembraneSynth().toDestination();
    const incorrectSound = new Tone.NoiseSynth().toDestination();

    // Helper to show/hide sections
    function showSection(section) {
        managementSection.classList.add('hidden');
        paramsSection.classList.add('hidden');
        flashcardSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        overallStatsSection.classList.add('hidden');
        section.classList.remove('hidden');
    }

    // --- CSV Upload and Database Management ---
    csvUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(csvUploadForm);
        try {
            const response = await fetch('/api/upload_csv', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                displayMessage(uploadMessage, data.message, 'success');
                loadWordList(); // Refresh the word list after upload
            } else {
                displayMessage(uploadMessage, data.message, 'error');
            }
        } catch (error) {
            console.error('Error uploading CSV:', error);
            displayMessage(uploadMessage, 'An error occurred during upload.', 'error');
        }
    });

    // Function to display messages
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`; // Reset class and apply new one
        element.classList.remove('hidden'); // Ensure it's visible
        setTimeout(() => {
            element.classList.add('hidden'); // Hide after some time
        }, 5000);
    }

    // Load word list for management table
    async function loadWordList() {
        try {
            const response = await fetch('/api/words');
            const data = await response.json();
            wordListTableBody.innerHTML = ''; // Clear existing rows
            if (data.success && data.words.length > 0) {
                data.words.forEach(word => {
                    const row = wordListTableBody.insertRow();
                    row.insertCell(0).textContent = word.word_text;
                    row.insertCell(1).textContent = word.correct_count;
                    row.insertCell(2).textContent = word.incorrect_count;
                    const actionsCell = row.insertCell(3);

                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.classList.add('button', 'edit-button');
                    editBtn.addEventListener('click', () => openEditModal(word.id, word.word_text));
                    actionsCell.appendChild(editBtn);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.classList.add('button', 'delete-button');
                    deleteBtn.addEventListener('click', () => openDeleteModal(word.id, word.word_text));
                    actionsCell.appendChild(deleteBtn);
                });
            } else {
                const row = wordListTableBody.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 4;
                cell.textContent = 'No words in the database. Upload a CSV!';
                cell.style.textAlign = 'center';
            }
        } catch (error) {
            console.error('Error loading word list:', error);
            const row = wordListTableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Error loading words. See console for details.';
            cell.style.color = 'red';
        }
    }

    refreshWordsBtn.addEventListener('click', loadWordList);

    // --- New button to navigate to test parameters ---
    goToTestParamsBtn.addEventListener('click', () => {
        showSection(paramsSection);
    });

    // --- Custom Modal Functions ---
    let currentModalAction = null; // To store the function to execute on modal confirm

    function showModal(message, showInput = false, initialValue = '') {
        modalMessage.textContent = message;
        modalInput.classList.toggle('hidden', !showInput);
        modalInput.value = initialValue;
        customModal.classList.remove('hidden');
    }

    function hideModal() {
        customModal.classList.add('hidden');
        modalInput.value = '';
        currentModalAction = null;
    }

    closeModalBtn.addEventListener('click', hideModal);
    modalCancelBtn.addEventListener('click', hideModal);

    modalConfirmBtn.addEventListener('click', () => {
        if (currentModalAction) {
            currentModalAction();
        }
        hideModal();
    });

    // Delete Word Logic
    function openDeleteModal(wordId, wordText) {
        showModal(`Are you sure you want to delete "${wordText}"?`);
        currentModalAction = async () => {
            try {
                const response = await fetch(`/api/delete_word/${wordId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                    displayMessage(uploadMessage, data.message, 'success');
                    loadWordList(); // Refresh list
                } else {
                    displayMessage(uploadMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting word:', error);
                displayMessage(uploadMessage, 'An error occurred during deletion.', 'error');
            }
        };
    }

    // Edit Word Logic
    function openEditModal(wordId, currentWordText) {
        showModal(`Edit word:`, true, currentWordText);
        currentModalAction = async () => {
            const newWordText = modalInput.value.trim();
            if (!newWordText) {
                displayMessage(uploadMessage, 'Word text cannot be empty.', 'error');
                return;
            }
            try {
                const response = await fetch('/api/update_word', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ word_id: wordId, new_word_text: newWordText })
                });
                const data = await response.json();
                if (data.success) {
                    displayMessage(uploadMessage, data.message, 'success');
                    loadWordList(); // Refresh list
                } else {
                    displayMessage(uploadMessage, data.message, 'error');
                }
            } catch (error) {
                console.error('Error updating word:', error);
                displayMessage(uploadMessage, 'An error occurred during update.', 'error');
            }
        };
    }

    // --- Flashcard Test Logic ---
    startTestBtn.addEventListener('click', async () => {
        const numWords = parseInt(numWordsInput.value, 10);
        if (isNaN(numWords) || numWords < 0) {
            displayMessage(uploadMessage, 'Please enter a valid number of words.', 'error');
            return;
        }

        try {
            // Fetch all words to create a pool, then select randomly client-side
            const response = await fetch('/api/words');
            const data = await response.json();
            if (!data.success || data.words.length === 0) {
                displayMessage(uploadMessage, 'No words in the database to start a test. Please upload a CSV.', 'error');
                return;
            }

            let allWords = data.words;
            if (numWords === 0 || numWords > allWords.length) {
                wordsToTest = shuffleArray(allWords); // Use all words if 0 or more than available
            } else {
                wordsToTest = shuffleArray(allWords).slice(0, numWords);
            }
            
            totalWordsInTest = wordsToTest.length;
            currentWordIndex = 0;
            sessionCorrect = 0;
            sessionIncorrect = 0;

            if (totalWordsInTest === 0) {
                displayMessage(uploadMessage, 'No words selected for the test. Check your input or database.', 'error');
                return;
            }

            showSection(flashcardSection);
            loadNextWord();

        } catch (error) {
            console.error('Error starting test:', error);
            displayMessage(uploadMessage, 'Failed to load words for test. Check console.', 'error');
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    function loadNextWord() {
        if (currentWordIndex < totalWordsInTest) {
            currentWord = wordsToTest[currentWordIndex];
            currentWordDisplay.textContent = currentWord.word_text;
            wordCounter.textContent = `Word ${currentWordIndex + 1} of ${totalWordsInTest}`;
            currentWordIndex++;
        } else {
            endSession();
        }
    }

    // Removed the pronounceBtn event listener as automated pronunciation is no longer a feature.

    correctBtn.addEventListener('click', async () => {
        sessionCorrect++;
        correctSound.triggerAttackRelease("C5", "8n"); // Play a higher note for correct
        await updateWordStats(currentWord.id, true);
        loadNextWord();
    });

    incorrectBtn.addEventListener('click', async () => {
        sessionIncorrect++;
        incorrectSound.triggerAttackRelease("8n"); // Play noise for incorrect
        await updateWordStats(currentWord.id, false);
        loadNextWord();
    });

    async function updateWordStats(wordId, isCorrect) {
        try {
            await fetch('/api/update_pronunciation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word_id: wordId, is_correct: isCorrect })
            });
        } catch (error) {
            console.error('Error updating word stats:', error);
        }
    }

    async function endSession() {
        showSection(resultsSection);
        const totalAttempts = sessionCorrect + sessionIncorrect;
        const percentage = totalAttempts > 0 ? (sessionCorrect / totalAttempts) * 100 : 0;
        
        resultsCorrect.textContent = sessionCorrect;
        resultsIncorrect.textContent = sessionIncorrect;
        resultsPercentage.textContent = `${percentage.toFixed(2)}%`;
    }

    restartTestBtn.addEventListener('click', () => {
        showSection(paramsSection);
    });

    viewOverallStatsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/results');
            const data = await response.json();
            if (data.success) {
                overallCorrect.textContent = data.results.total_correct;
                overallIncorrect.textContent = data.results.total_incorrect;
                overallPercentage.textContent = `${data.results.percentage}%`;
                showSection(overallStatsSection);
            } else {
                displayMessage(uploadMessage, 'Failed to fetch overall statistics.', 'error');
            }
        } catch (error) {
            console.error('Error fetching overall stats:', error);
            displayMessage(uploadMessage, 'An error occurred while fetching overall stats.', 'error');
        }
    });

    backToMainBtn.addEventListener('click', () => {
        showSection(managementSection); // Go back to the CSV upload/management section
    });

    // Initial load
    loadWordList();
    showSection(managementSection); // Start on the management section
});