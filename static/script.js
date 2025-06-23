// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const managementSection = document.getElementById('management-section');
    const paramsSection = document.getElementById('params-section');
    const flashcardSection = document.getElementById('flashcard-section');
    const resultsSection = document.getElementById('results-section');
    const overallStatsSection = document.getElementById('overall-stats-section');
    const failureChartSection = document.getElementById('failure-chart-section'); // New chart section

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
    const goToTestParamsBtn = document.getElementById('go-to-test-params-btn');

    // Custom Modal Elements
    const customModal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalInput = document.getElementById('modal-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const closeModalBtn = document.querySelector('.close-button');

    // Chart.js elements
    const failureFrequencyChartCanvas = document.getElementById('failureFrequencyChart');
    let failureChartInstance = null; // To hold the Chart.js instance

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
        failureChartSection.classList.add('hidden'); // Also hide chart section by default
        section.classList.remove('hidden');

        // Special handling for management section to ensure chart is visible
        if (section === managementSection) {
            loadFailureFrequencyChart(); // Load chart when main management section is shown
        }
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
                loadFailureFrequencyChart(); // Also reload chart after CSV upload
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
                    editBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L18.75 7.25l-3.75-3.75L3 17.25zM20.71 5.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Edit';
                    editBtn.classList.add('button', 'edit-button');
                    editBtn.addEventListener('click', () => openEditModal(word.id, word.word_text));
                    actionsCell.appendChild(editBtn);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> Delete';
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
    refreshWordsBtn.addEventListener('click', loadFailureFrequencyChart); // Also refresh chart on button click


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
                    loadFailureFrequencyChart(); // Refresh chart after deletion
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
                    loadFailureFrequencyChart(); // Refresh chart after update
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
        // Removed: loadFailureFrequencyChart(); // DO NOT refresh chart during test
    });

    incorrectBtn.addEventListener('click', async () => {
        sessionIncorrect++;
        incorrectSound.triggerAttackRelease("8n"); // Play noise for incorrect
        await updateWordStats(currentWord.id, false);
        loadNextWord();
        // Removed: loadFailureFrequencyChart(); // DO NOT refresh chart during test
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
        loadFailureFrequencyChart(); // Refresh chart after session ends
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

    // --- Chart Logic for Failure Frequency ---
    async function loadFailureFrequencyChart() {
        try {
            const response = await fetch('/api/failure_frequency');
            const data = await response.json();

            // Filter out words with incorrect_count of 0
            const filteredData = data.data.filter(item => item.incorrect_count > 0);

            if (!data.success || filteredData.length === 0) { // Check filtered data length
                failureChartSection.classList.add('hidden'); // Hide if no data or all counts are zero
                if (failureChartInstance) {
                    failureChartInstance.destroy(); // Destroy existing chart if no data
                    failureChartInstance = null;
                }
                return;
            }
            failureChartSection.classList.remove('hidden'); // Show if data exists

            const words = filteredData.map(item => item.word);
            const incorrectCounts = filteredData.map(item => item.incorrect_count);

            // Calculate cumulative percentage for Pareto chart
            let totalIncorrectAttempts = incorrectCounts.reduce((sum, count) => sum + count, 0);
            let cumulativeSum = 0;
            const cumulativePercentages = incorrectCounts.map(count => {
                cumulativeSum += count;
                return totalIncorrectAttempts > 0 ? (cumulativeSum / totalIncorrectAttempts) * 100 : 0;
            });

            if (failureChartInstance) {
                failureChartInstance.destroy(); // Destroy existing chart instance to redraw
            }

            failureChartInstance = new Chart(failureFrequencyChartCanvas, {
                type: 'bar',
                data: {
                    labels: words,
                    datasets: [{
                        label: 'Incorrect Count',
                        data: incorrectCounts,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)', // Reddish for failures
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1,
                        order: 2 // Bars should be behind the line
                    },
                    {
                        type: 'line', // For Pareto line
                        label: 'Cumulative %',
                        data: cumulativePercentages,
                        borderColor: 'rgba(52, 152, 219, 1)', // Blue for line
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        fill: false,
                        tension: 0.1, // Smooth the line
                        yAxisID: 'y1', // Use a secondary Y-axis
                        pointRadius: 4, // Make points visible
                        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                        pointBorderColor: 'white',
                        pointBorderWidth: 1,
                        order: 1 // Line should be on top
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Word'
                            },
                             ticks: {
                                // Rotate labels if they overlap
                                autoSkip: false,
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: { // Primary Y-axis for counts
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Incorrect Pronunciations'
                            }
                        },
                        y1: { // Secondary Y-axis for percentages (Pareto)
                            type: 'linear',
                            display: true,
                            position: 'right', // Place on right side
                            beginAtZero: true,
                            max: 100, // Max percentage is 100
                            grid: {
                                drawOnChartArea: false // Only draw grid lines for the first axis
                            },
                            title: {
                                display: true,
                                text: 'Cumulative Percentage (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Top Words by Failure Frequency (Pareto Chart)',
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.dataset.type === 'line') {
                                        label += context.raw.toFixed(2) + '%';
                                    } else {
                                        label += context.raw;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading failure frequency chart:', error);
            // If an error occurs or no data, ensure the chart section is hidden.
            failureChartSection.classList.add('hidden');
        }
    }

    // Initial load
    loadWordList();
    showSection(managementSection); // Start on the management section, which now triggers chart load
});