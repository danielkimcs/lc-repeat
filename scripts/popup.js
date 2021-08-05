let scheduleButtons = document.getElementsByClassName("schedule-btn");
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
        const { num, title, diff } = res[0].result;
        [questionNumber, questionTitle, questionDifficulty] = [num, title, diff];
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
        // alert(questionNumber + ": problem - " + questionTitle + "; schedule " + numDays + " days");
        chrome.storage.sync.get("problems", ({ problems }) => {
            let newProblems = { ...problems };
            let newScheduledDate = new Date();
            newScheduledDate.setDate(newScheduledDate.getDate() + numDays);

            if (questionNumber in newProblems) {
                let currentProblem = newProblems[questionNumber];
                let updatedProblem = {
                    ...currentProblem,
                    latestSolvedDate: new Date(),
                    scheduledDate: newScheduledDate
                };
                newProblems[questionNumber] = updatedProblem;
            } else {
                newProblems[questionNumber] = {
                    title: questionTitle,
                    difficulty: questionDifficulty,
                    latestSolvedDate: new Date(),
                    scheduledDate: newScheduledDate
                }
            }

            chrome.storage.sync.set({ problems: newProblems }, () => {
                console.log(newProblems);
            });
        });
    });
}

const fetchQuestionInfo = () => {
    let questionHeader = document.querySelectorAll('[data-cy="question-title"]')[0];
    const [num, title] = questionHeader.innerText.split(". ");
    const diff = document.querySelectorAll("[diff]")[0].innerText;
    return { num, title, diff };
}
