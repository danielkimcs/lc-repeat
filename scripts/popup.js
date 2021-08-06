const notesInput = document.getElementById("notes");
let scheduleButtons = document.getElementsByClassName("schedule-btn");
let formContainer = document.getElementsByClassName("form-container")[0];
let saveMessage = document.getElementsByClassName("save-message")[0];

let problemUrl = undefined;
let questionNumber = undefined;
let questionTitle = undefined;
let questionDifficulty = undefined;

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

Array.prototype.forEach.call(scheduleButtons, button => {
    button.addEventListener("click", async () => {
        const numDays = parseInt(button.value);
        scheduleCurrentProblem(numDays);
    });
});

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
                formContainer.classList.add("hide");
                saveMessage.classList.remove("hide");
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
