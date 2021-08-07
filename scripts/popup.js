import { formatDate, getDaysInBetween } from "../utility/helpers.js";

const notesInput = document.getElementById("notes");
let scheduleButtons = document.getElementsByClassName("schedule-btn");
let tableToggleBtn = document.querySelector(".table-toggle");
let formContainer = document.querySelector(".form-container");
let saveMessage = document.querySelector(".save-message");
let tableContainer = document.querySelector(".problems-container");
let togglePrevNotes = document.querySelector(".toggle-prev-notes");
let prevNotesContainer = document.querySelector(".previous-notes-container");
let problemsTable = document.querySelector(".problems-container table");

let problemUrl = undefined;
let questionNumber = undefined;
let questionTitle = undefined;
let questionDifficulty = undefined;

let isTableVisible = true;
let isPrevNotesVisible = false;

const tableHeaders = ['#', 'Problem Title', 'Due Date'];

const difficultyColors = {
    "Easy": "rgba(0,175,155,0.6)",
    "Medium": "rgba(255,184,0,0.6)",
    "Hard": "rgba(255,45,85,0.6)"
}

const hideElement = (element, hide) => {
    if (hide) element.classList.add("hide");
    else element.classList.remove("hide");
}

const displayProblemsTable = (problems) => {
    problemsTable.innerHTML = "";
    let header = problemsTable.insertRow(0);
    tableHeaders.forEach(text => {
        let th = document.createElement('th');
        th.innerHTML = text;
        header.appendChild(th);
    });

    Object.keys(problems)
        .sort((p1, p2) => Date.parse(problems[p1].current.scheduledDate) - Date.parse(problems[p2].current.scheduledDate))
        .forEach((problemNumber, index) => {
            let problem = problems[problemNumber];
            let problemRow = problemsTable.insertRow(index + 1);
            problemRow.insertCell(0).innerHTML = problemNumber;
            problemRow.insertCell(1).innerHTML = problem.title;
            problemRow.insertCell(2).innerHTML = formatDate(problem.current.scheduledDate) + " (" + getDaysInBetween(new Date().toJSON(), problem.current.scheduledDate) + " days)";

            problemRow.addEventListener('click', () => {
                chrome.tabs.create({ url: problem.link });
            });

            problemRow.classList.add('problem-row');
            problemRow.style.backgroundColor = difficultyColors[problem.difficulty];
        });
}

const loadQuestionInfo = async (callback) => {
    if (questionNumber !== undefined) {
        callback();
        return;
    }

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: fetchQuestionInfo,
    }, (res) => {
        const { url, num, title, diff } = res[0].result;
        [problemUrl, questionNumber, questionTitle, questionDifficulty] = [url, num, title, diff];
        callback();
        return;
    });
}

const scheduleCurrentProblem = async (numDays) => {
    loadQuestionInfo(() => {
        const userNotes = notesInput.value;

        chrome.storage.sync.get("problems", ({ problems }) => {
            let newProblems = { ...problems };
            let newScheduledDate = new Date();
            newScheduledDate.setDate(newScheduledDate.getDate() + numDays);

            if (questionNumber in newProblems) {
                const currentProblem = newProblems[questionNumber];
                const updatedProblem = {
                    ...currentProblem,
                    history: currentProblem.history.concat({
                        ...currentProblem.current
                    }),
                    current: {
                        notes: userNotes,
                        solvedDate: (new Date()).toJSON(),
                        scheduledDate: (newScheduledDate).toJSON()
                    }
                };
                newProblems[questionNumber] = updatedProblem;
            } else {
                newProblems[questionNumber] = {
                    title: questionTitle,
                    difficulty: questionDifficulty,
                    link: problemUrl,
                    current: {
                        notes: userNotes,
                        solvedDate: (new Date()).toJSON(),
                        scheduledDate: (newScheduledDate).toJSON()
                    },
                    history: []
                }
            }

            chrome.storage.sync.set({ problems: newProblems }, () => {
                hideElement(formContainer, true);
                hideElement(saveMessage, false);
                hideElement(togglePrevNotes, true);
                hideElement(prevNotesContainer, true);
                displayProblemsTable(newProblems);
            });
        });
    });
}

const fetchQuestionInfo = () => {
    let questionHeader = document.querySelectorAll('[data-cy="question-title"]')[0];
    const [num, title] = questionHeader.innerText.split(". ");
    const diff = document.querySelectorAll("[diff]")[0].innerText;
    const url = window.location.href;
    return { url, num, title, diff };
}

const addScheduleBtnListeners = () => {
    Array.prototype.forEach.call(scheduleButtons, button => {
        button.addEventListener("click", async () => {
            const numDays = parseInt(button.value);
            scheduleCurrentProblem(numDays);
        });
    });
}

const addTogglePrevNotesListener = () => {
    chrome.storage.sync.get("problems", ({ problems }) => {
        loadQuestionInfo(() => {
            if (problems[questionNumber] && problems[questionNumber].current.notes) {
                let notesTextArea = document.getElementById("prevNotes");
                notesTextArea.innerText = problems[questionNumber].current.notes;
                togglePrevNotes.addEventListener("click", () => {
                    isPrevNotesVisible = !isPrevNotesVisible;
                    hideElement(prevNotesContainer, !isPrevNotesVisible);
                    if (isPrevNotesVisible) {
                        togglePrevNotes.innerHTML = "Hide previous notes";
                    } else {
                        togglePrevNotes.innerHTML = "Show previous notes";
                    }
                });
            } else {
                hideElement(togglePrevNotes, true);
            }
        });
    });
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.url.includes("leetcode.com/problems/")) {
        addScheduleBtnListeners();
        tableToggleBtn.innerHTML = "+";
        isTableVisible = false;
        hideElement(tableContainer, !isTableVisible);
        addTogglePrevNotesListener();
        togglePrevNotes.innerHTML = "Show previous notes";
    } else {
        hideElement(togglePrevNotes, true);
        hideElement(formContainer, true);
        hideElement(tableToggleBtn, true);
    }
});

chrome.storage.sync.get("problems", ({ problems }) => {
    displayProblemsTable(problems);
});

tableToggleBtn.addEventListener("click", () => {
    isTableVisible = !isTableVisible;
    hideElement(tableContainer, !isTableVisible);
    if (isTableVisible) {
        tableToggleBtn.innerHTML = "&minus;";
    } else {
        tableToggleBtn.innerHTML = "+";
    }
});