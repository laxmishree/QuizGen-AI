let currentQuiz=null;
let quizSubmitted=false;

function hideAllPages(){
    document.getElementById("home").style.display="none";
    document.getElementById("features").style.display="none";
    document.getElementById("create").style.display="none";
    document.getElementById("quizResult").style.display="none";
    document.getElementById("history").style.display="none";
    document.getElementById("dashboard").style.display="none";
    document.getElementById("dailyChallengePage").style.display="none";
}

function showHome(){
    hideAllPages();
    document.getElementById("home").style.display="flex";
    window.scrollTo({top:0,behavior:"smooth"});
}

function showHomeAndFeatures(){
    hideAllPages();
    document.getElementById("home").style.display="flex";
    document.getElementById("features").style.display="block";
    window.scrollTo({top:0,behavior:"smooth"});
}

function showCreatePage(){
    hideAllPages();
    document.getElementById("create").style.display="block";
    window.scrollTo({top:0,behavior:"smooth"});
}

async function generateQuiz(){
    const studyMaterial=document.getElementById("studyMaterial").value;
    const questionNumber=document.getElementById("questionNumber").value;
    const difficulty=document.getElementById("difficulty").value;
    const questionType=document.getElementById("questionType").value;
    const documentInput=document.getElementById("studyDocument");

    if(studyMaterial.trim()===""&&documentInput.files.length===0){
        alert("Please enter your study material or upload a document!");
        return;
    }

    const button=document.querySelector(".quiz-box button");
    const resultSection=document.getElementById("quizResult");
    const quizContent=document.getElementById("quizContent");

    button.innerText="Generating Quiz... 🤖";
    button.disabled=true;

    hideAllPages();
    resultSection.style.display="block";

    quizContent.innerHTML=`
        <div class="loading">
            🤖 Gemini AI is creating your quiz...
            <br><br>
            Please wait a few seconds.
        </div>
    `;

    try{
        const formData=new FormData();
        formData.append("studyMaterial",studyMaterial);
        formData.append("questionNumber",questionNumber);
        formData.append("difficulty",difficulty);
        formData.append("questionType",questionType);

        if(documentInput.files.length>0){
            formData.append("studyDocument",documentInput.files[0]);
        }

        const response=await fetch("/generate_quiz",{method:"POST",body:formData});

        if(!response.ok){
            throw new Error("Server error: "+response.status);
        }

        const data=await response.json();

        if(data.error){
            throw new Error(data.error);
        }

        if(!data.quiz){
            throw new Error("No quiz was returned.");
        }

        currentQuiz=JSON.parse(data.quiz);
        quizSubmitted=false;

        let quizHTML="";

        currentQuiz.questions.forEach((question,index)=>{
            quizHTML+=`
                <div class="question-card">
                    <h3>Question ${index+1}</h3>
                    <p class="question-text">${question.question}</p>
                    <div class="options">
            `;

            question.options.forEach(option=>{
                quizHTML+=`
                    <label class="option">
                        <input type="radio" name="question${index}" value="${option}">
                        <span>${option}</span>
                    </label>
                `;
            });

            quizHTML+=`
                    </div>
                    <div class="answer-box" style="display:none;">
                        <strong>Correct Answer:</strong>
                        ${question.answer}
                        <br><br>
                        <strong>Explanation:</strong>
                        ${question.explanation}
                    </div>
                </div>
            `;
        });

        quizHTML+=`
            <button class="submit-quiz" onclick="calculateScore()">
                Submit Quiz 🎯
            </button>
        `;

        quizContent.innerHTML=quizHTML;

        window.scrollTo({top:0,behavior:"smooth"});
    }catch(error){
        console.error(error);
        quizContent.innerHTML=`
            <div class="loading">
                ❌ Something went wrong.
                <br><br>
                Please try generating the quiz again.
            </div>
        `;
    }

    button.innerText="Generate Quiz 🤖";
    button.disabled=false;
}

function calculateScore(){
    if(quizSubmitted)return;

    if(!currentQuiz){
        alert("Please generate a quiz first.");
        return;
    }

    quizSubmitted=true;

    const submitButton=document.querySelector(".submit-quiz");

    if(submitButton){
        submitButton.disabled=true;
        submitButton.innerText="Quiz Submitted ✓";
    }

    let score=0;
    const wrongAnswers=[];
    const userAnswers=[];

    const answerBoxes=document.querySelectorAll(".answer-box");

    currentQuiz.questions.forEach((question,index)=>{
        const selected=document.querySelector(`input[name="question${index}"]:checked`);

        if(answerBoxes[index]){
            answerBoxes[index].style.display="block";
        }

        const selectedAnswer=selected?selected.value:"Not Answered";

        userAnswers.push(selectedAnswer);

        if(selected&&selected.value===question.answer){
            score++;
        }else{
            wrongAnswers.push({
                question:question.question,
                selectedAnswer:selectedAnswer,
                correctAnswer:question.answer,
                explanation:question.explanation
            });
        }
    });

    const total=currentQuiz.questions.length;
    const percentage=Math.round((score/total)*100);

    let message;

    if(percentage>=80){
        message="🎉 Excellent! You did a great job!";
    }else if(percentage>=60){
        message="👏 Good work! Keep practicing!";
    }else{
        message="💪 Keep learning! You can improve!";
    }

    saveQuizToHistory({
        score:score,
        total:total,
        percentage:percentage,
        difficulty:document.getElementById("difficulty").value,
        questionType:document.getElementById("questionType").value,
        questionNumber:document.getElementById("questionNumber").value,
        wrongAnswers:wrongAnswers,
        userAnswers:userAnswers,
        questions:currentQuiz.questions,
        date:new Date().toLocaleString()
    });

    const quizContent=document.getElementById("quizContent");
    const result=document.createElement("div");

    result.className="score-result";

    result.innerHTML=`
        <h2>🎉 Quiz Completed!</h2>
        <p>Your Score</p>
        <div class="score">${score} / ${total}</div>
        <p>Percentage: <strong>${percentage}%</strong></p>
        <p>${message}</p>
        <button class="restart-quiz" onclick="restartQuiz()">
            Try Another Quiz 🔄
        </button>
    `;

    quizContent.appendChild(result);

    highlightAnswers();

    result.scrollIntoView({behavior:"smooth"});
}

function highlightAnswers(){
    if(!currentQuiz)return;

    currentQuiz.questions.forEach((question,index)=>{
        const selected=document.querySelector(`input[name="question${index}"]:checked`);
        const labels=document.querySelectorAll(`input[name="question${index}"]`);

        labels.forEach(input=>{
            const label=input.closest("label");

            if(!label)return;

            if(input.value===question.answer){
                label.classList.add("correct-answer");
            }

            if(selected&&input===selected&&input.value!==question.answer){
                label.classList.add("wrong-answer");
            }
        });
    });
}

function saveQuizToHistory(quizData){
    let history=JSON.parse(localStorage.getItem("quizHistory"))||[];
    history.unshift(quizData);
    localStorage.setItem("quizHistory",JSON.stringify(history));
    displayQuizHistory();
}

function displayQuizHistory(){
    const historyContent=document.getElementById("historyContent");

    if(!historyContent)return;

    const history=JSON.parse(localStorage.getItem("quizHistory"))||[];

    if(history.length===0){
        historyContent.innerHTML="<p>No quizzes attempted yet.</p>";
        return;
    }

    let historyHTML="";

    history.forEach((quiz,index)=>{
        historyHTML+=`
            <div class="history-card">
                <h3>Quiz Attempt ${history.length-index}</h3>
                <p>📅 ${quiz.date}</p>
                <p>🎯 Difficulty: ${quiz.difficulty}</p>
                <p>📝 Questions: ${quiz.total}</p>
                <p class="history-score">
                    Score: ${quiz.score}/${quiz.total}
                </p>
                <p>
                    Percentage:
                    <strong>${quiz.percentage}%</strong>
                </p>
                <button onclick="viewQuizDetails(${index})">
                    View Details
                </button>
            </div>
        `;
    });

    historyContent.innerHTML=historyHTML;
}

function viewQuizDetails(index){
    const history=JSON.parse(localStorage.getItem("quizHistory"))||[];
    const quiz=history[index];

    if(!quiz)return;

    hideAllPages();

    const historyContent=document.getElementById("historyContent");
    document.getElementById("history").style.display="block";

    let detailsHTML=`
        <div class="quiz-card">
            <h2>Quiz Attempt ${history.length-index}</h2>
            <div class="score-result">
                <h3>Score: ${quiz.score}/${quiz.total}</h3>
                <p>Percentage: <strong>${quiz.percentage}%</strong></p>
                <p>Difficulty: ${quiz.difficulty}</p>
                <p>Date: ${quiz.date}</p>
            </div>
    `;

    if(quiz.questions){
        quiz.questions.forEach((question,qIndex)=>{
            const userAnswer=quiz.userAnswers&&quiz.userAnswers[qIndex]
                ?quiz.userAnswers[qIndex]
                :"Not Answered";

            detailsHTML+=`
                <div class="question-card">
                    <h3>Question ${qIndex+1}</h3>
                    <p class="question-text">${question.question}</p>
                    <div class="answer-box" style="display:block;">
                        <strong>Your Answer:</strong> ${userAnswer}
                        <br><br>
                        <strong>Correct Answer:</strong> ${question.answer}
                        <br><br>
                        <strong>Explanation:</strong> ${question.explanation}
                    </div>
                </div>
            `;
        });
    }

    detailsHTML+=`
        <button class="back-to-quiz" onclick="showHistory()">
            Back to History
        </button>
        </div>
    `;

    historyContent.innerHTML=detailsHTML;

    window.scrollTo({top:0,behavior:"smooth"});
}

function restartQuiz(){
    currentQuiz=null;
    quizSubmitted=false;

    document.getElementById("quizContent").innerHTML="";
    document.getElementById("studyMaterial").value="";
    document.getElementById("questionNumber").value="5";
    document.getElementById("difficulty").value="Easy";
    document.getElementById("questionType").value="MCQ";
    document.getElementById("studyDocument").value="";
    document.getElementById("fileName").textContent="";

    showCreatePage();
}

function showHistory(){
    hideAllPages();
    document.getElementById("history").style.display="block";
    displayQuizHistory();
    window.scrollTo({top:0,behavior:"smooth"});
}

function showDashboard(){
    hideAllPages();
    document.getElementById("dashboard").style.display="block";
    displayDashboard();
    window.scrollTo({top:0,behavior:"smooth"});
}

function displayDashboard(){
    const history=JSON.parse(localStorage.getItem("quizHistory"))||[];

    const totalQuizzes=document.getElementById("totalQuizzes");
    const averageScore=document.getElementById("averageScore");
    const questionsAttempted=document.getElementById("questionsAttempted");
    const performanceList=document.getElementById("performanceList");

    if(!totalQuizzes)return;

    totalQuizzes.textContent=history.length;

    const totalQuestions=history.reduce((sum,quiz)=>sum+Number(quiz.total||0),0);

    questionsAttempted.textContent=totalQuestions;

    const average=history.length
        ?Math.round(history.reduce((sum,quiz)=>sum+Number(quiz.percentage||0),0)/history.length)
        :0;

    averageScore.textContent=average+"%";

    if(history.length===0){
        performanceList.innerHTML="<p>No quiz performance available yet.</p>";
        return;
    }

    performanceList.innerHTML=history.slice(0,5).map((quiz,index)=>`
        <div class="performance-item">
            <strong>Quiz Attempt ${history.length-index}</strong>
            <p>📅 ${quiz.date}</p>
            <p>🎯 Difficulty: ${quiz.difficulty}</p>
            <p>📝 Questions: ${quiz.total}</p>
            <p class="performance-score">
                Score: ${quiz.score}/${quiz.total} (${quiz.percentage}%)
            </p>
        </div>
    `).join("");
}

document.getElementById("studyDocument").addEventListener("change",function(){
    const fileName=document.getElementById("fileName");

    if(this.files.length>0){
        fileName.textContent="Selected: "+this.files[0].name;
    }else{
        fileName.textContent="";
    }
});

function showDailyChallenge(){
    hideAllPages();
    document.getElementById("dailyChallengePage").style.display="block";
    window.scrollTo({top:0,behavior:"smooth"});
}

async function startDailyChallenge(){
    const content=document.getElementById("dailyChallengeContent");
    const topic=document.getElementById("dailyTopic").value;
    const difficulty=document.getElementById("dailyDifficulty").value;
    const questionNumber=document.getElementById("dailyQuestionNumber").value;
    const questionType=document.getElementById("dailyQuestionType").value;

    content.innerHTML=`
        <div class="daily-welcome-card">
            <div class="daily-icon">⏳</div>
            <h3>Creating Your Challenge...</h3>
            <p>Gemini AI is preparing your questions.</p>
        </div>
    `;

    try{
        const formData=new FormData();
        formData.append("topic",topic);
        formData.append("difficulty",difficulty);
        formData.append("questionNumber",questionNumber);
        formData.append("questionType",questionType);

        const response=await fetch("/generate_daily_challenge",{
            method:"POST",
            body:formData
        });

        const data=await response.json();

        if(data.error){
            throw new Error(data.error);
        }

        currentQuiz=JSON.parse(data.quiz);
        quizSubmitted=false;
        content.innerHTML="";

        currentQuiz.questions.forEach((q,index)=>{
            const card=document.createElement("div");
            card.className="question-card";

            let optionsHTML="";

            q.options.forEach(option=>{
                optionsHTML+=`
                    <label>
                        <input type="radio" name="daily-question-${index}" value="${option}">
                        ${option}
                    </label>
                `;
            });

            card.innerHTML=`
                <h3>Question ${index+1}</h3>
                <p>${q.question}</p>
                ${optionsHTML}
                <div class="answer-box" style="display:none;">
                    <strong>Correct Answer:</strong> ${q.answer}
                    <br><br>
                    <strong>Explanation:</strong> ${q.explanation}
                </div>
            `;

            content.appendChild(card);
        });

        const submitButton=document.createElement("button");
        submitButton.textContent="Submit Challenge";
        submitButton.className="daily-submit-button";
        submitButton.onclick=submitDailyChallenge;
        content.appendChild(submitButton);
    }catch(error){
        console.error(error);

        content.innerHTML=`
            <div class="daily-welcome-card">
                <div class="daily-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>We couldn't create your challenge. Please try again.</p>
                <button onclick="restartDailyChallenge()">Try Again</button>
            </div>
        `;
    }
}

function submitDailyChallenge(){
    if(quizSubmitted)return;

    quizSubmitted=true;

    const questionCards=document.querySelectorAll("#dailyChallengeContent .question-card");
    let score=0;
    let answered=0;

    questionCards.forEach((card,index)=>{
        const selected=card.querySelector(`input[name="daily-question-${index}"]:checked`);
        const correctAnswer=currentQuiz.questions[index].answer;
        const labels=card.querySelectorAll("label");

        labels.forEach(label=>{
            const input=label.querySelector("input");

            if(input.value===correctAnswer){
                label.classList.add("correct-answer");
            }

            if(selected&&input===selected){
                answered++;

                if(input.value===correctAnswer){
                    score++;
                }else{
                    label.classList.add("wrong-answer");
                }
            }
        });

        const answerBox=card.querySelector(".answer-box");

        if(answerBox){
            answerBox.style.display="block";
        }
    });

    const total=currentQuiz.questions.length;
    const percentage=Math.round((score/total)*100);

    let message="";

    if(percentage===100){
        message="Perfect score! 🔥";
    }else if(percentage>=80){
        message="Excellent work! 🌟";
    }else if(percentage>=60){
        message="Great effort! 💜";
    }else if(percentage>=40){
        message="Keep practicing! 📚";
    }else{
        message="Don't give up! Try again! 💪";
    }

    const result=document.createElement("div");
    result.className="daily-result-card";

    result.innerHTML=`
        <h2>Challenge Complete 🎉</h2>
        <div class="daily-score">${score}/${total}</div>
        <p class="daily-percentage">${percentage}%</p>
        <h3>${message}</h3>
        <p>You answered ${answered} out of ${total} questions.</p>
        <button onclick="restartDailyChallenge()">Try Another Challenge</button>
    `;

    document.getElementById("dailyChallengeContent").appendChild(result);

    const submitButton=document.querySelector(".daily-submit-button");

    if(submitButton){
        submitButton.disabled=true;
        submitButton.textContent="Challenge Submitted ✓";
    }

    window.scrollTo({
        top:document.getElementById("dailyChallengePage").offsetTop,
        behavior:"smooth"
    });
}

function restartDailyChallenge(){
    document.getElementById("dailyChallengeContent").innerHTML=`
        <div class="daily-welcome-card">
            <div class="daily-icon">🧠</div>
            <h3>Ready for Another Challenge?</h3>
            <p>Change your preferences and generate a new quiz.</p>
            <div class="daily-options">
                <div class="daily-option">
                    <label for="dailyTopic">Topic</label>
                    <select id="dailyTopic">
                        <option value="Random">🎲 Random Topic</option>
                        <option value="Data Structures">Data Structures</option>
                        <option value="DBMS">DBMS</option>
                        <option value="Operating Systems">Operating Systems</option>
                        <option value="Computer Organization">Computer Organization</option>
                        <option value="Java Programming">Java Programming</option>
                        <option value="Digital Electronics">Digital Electronics</option>
                        <option value="Python Programming">Python Programming</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="General Knowledge">General Knowledge</option>
                        <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>
                    </select>
                </div>
                <div class="daily-option">
                    <label for="dailyDifficulty">Difficulty</label>
                    <select id="dailyDifficulty">
                        <option value="Easy">Easy</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
                <div class="daily-option">
                    <label for="dailyQuestionNumber">Questions</label>
                    <select id="dailyQuestionNumber">
                        <option value="5" selected>5 Questions</option>
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                    </select>
                </div>
                <div class="daily-option">
                    <label for="dailyQuestionType">Question Type</label>
                    <select id="dailyQuestionType">
                        <option value="MCQ" selected>Multiple Choice</option>
                        <option value="True/False">True / False</option>
                    </select>
                </div>
            </div>
            <button onclick="startDailyChallenge()">Start Challenge</button>
        </div>
    `;
}

window.addEventListener("DOMContentLoaded",()=>{
    hideAllPages();
    document.getElementById("home").style.display="flex";
});