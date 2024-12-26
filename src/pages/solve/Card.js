import React, { useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

function Card () {  
  const [questionIndex, setQuestionIndex] = useState(0); // 현재 문제의 인덱스
  const location = useLocation();
  const questions = location.state.questions;
  const tags = location.state.tags;
  const navigate = useNavigate();
  
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0); 
  const [wrongCount, setWrongCount] = useState(0); 

  const goResult = (correct, wrong) => {
    navigate("/card/result", {
      state: {
        questions: questions,
        tags: tags,
        result: { correct: correct, wrong: wrong },
      },
    });
  };

  const correct = async () => {
    const updatedCorrectCount = correctCount + 1;
    setCorrectCount(updatedCorrectCount);
    if (questionIndex === questions.length - 1) {
      goResult(updatedCorrectCount, wrongCount);
    } else {
      nextQuestion();
    }
    setShowAnswer(false);

    const currentQuestion = questions[questionIndex];
    const title = currentQuestion.title;

    try {
      // question.csv 업데이트
      const updateQuestionResult = await window.electronAPI.updateQuestion({ title, correctness: 'correct' });
      if (!updateQuestionResult.success) {
        console.error(updateQuestionResult.message);
      }

      // history.csv 업데이트
      const updateHistoryResult = await window.electronAPI.updateHistory({ correct: 1, solved: 1 });
      if (!updateHistoryResult.success) {
        console.error(updateHistoryResult.message);
      }
    } catch (error) {
      console.error('IPC 업데이트 오류:', error);
    }
  };
  
  const wrong = async () => {
    const updatedWrongCount = wrongCount + 1;
    setWrongCount(updatedWrongCount);
    if (questionIndex === questions.length - 1) {
      goResult(correctCount, updatedWrongCount);
    } else {
      nextQuestion();
    }
    setShowAnswer(false);

    const currentQuestion = questions[questionIndex];
    const title = currentQuestion.title;

    try {
      // question.csv 업데이트
      const updateQuestionResult = await window.electronAPI.updateQuestion({ title, correctness: 'wrong' });
      if (!updateQuestionResult.success) {
        console.error(updateQuestionResult.message);
      }

      // history.csv 업데이트
      const updateHistoryResult = await window.electronAPI.updateHistory({ correct: 0, solved: 1 });
      if (!updateHistoryResult.success) {
        console.error(updateHistoryResult.message);
      }
    } catch (error) {
      console.error('IPC 업데이트 오류:', error);
    }
  };

  const nextQuestion = () => {
    setQuestionIndex((prevIndex) => prevIndex + 1);
  };

  return (
    <main className="ml-20 h-[100vh]">
      <div className="sm:rounded-lg h-full flex flex-col">
        <div className="p-4 flex justify-between border-b">
          <div>
            <h1 className="text-2xl font-semibold">{tags.map((tag) => tag + " ")}</h1>
            <h1 className=" text-md font-normal text-gray-400">총 {questions.length} 문제</h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-5 p-10 items-center bg-gray-50">
          
          {questions[questionIndex].img && (
            <div className="flex w-3/4 h-[300px] bg-white rounded-2xl">
              <img
                className="w-1/2 bg-gray-50 h-auto rounded-l-2xl"
                src={questions[questionIndex].img}
                alt=""
              />
              <div className="w-1/2 p-5">
                <div className="text-lg font-bold">
                  <span>
                    {questions[questionIndex].title}
                  </span>
                </div>

                <div className="text-md font-semibold mt-2 text-gray-500">
                  {showAnswer && (<span>
                    {questions[questionIndex].answer}
                  </span>)}
                  
                </div>
              </div>
            </div>
          )}
          
          {!questions[questionIndex].img && (
            <div className="w-3/4 h-[300px] bg-white rounded-2xl ">         
              <div 
                style={{
                  fontSize: "clamp(0.8rem, 2vw, 1.3rem)", // 글자 크기를 동적으로 조정
                }}            
                className="w-full text-center text-lg font-bold mt-10 px-3">
                {questions[questionIndex].title}
              </div>

              <div className="w-full text-md whitespace-nowrap font-semibold mt-5 text-gray-500 flex justify-center items-center">
                {showAnswer && (<div>
                  {questions[questionIndex].answer}
                </div>)}
                
              </div>

            </div>
          )}

          {!showAnswer && (
            <div className="flex  justify-center">
              <div 
                onClick={() => setShowAnswer(true)}
                className="cursor-pointer rounded-2xl bg-blue-500 font-bold text-white py-2 w-40 text-center text-sm">
                정답
              </div>
            </div>
          )}
          {showAnswer && (
            <div className="flex gap-5 justify-center">
              <div 
                onClick={wrong}
                className="cursor-pointer rounded-2xl bg-gray-100 font-bold py-2 w-40 text-center text-sm">
                틀림
              </div>
              <div 
                onClick={correct}
                className="cursor-pointer rounded-2xl bg-blue-500 font-bold text-white py-2 w-40 text-center text-sm">
                맞음
              </div>
            </div>
          )}
          
          <div className="w-3/4 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} // 현재 진행 상황 업데이트
              />
          </div>
        </div>
      </div>

      <div className="hidden fixed z-40 bottom-5 right-5 flex gap-2">
        <div className="rounded-full p-2 text-white bg-blue-300 hover:bg-blue-500 shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </div>
        <div className="rounded-full p-2 text-white bg-blue-300 hover:bg-blue-500 shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>
      </div>
    </main>
  );
}

export default Card;