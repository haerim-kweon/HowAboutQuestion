import React, { useState } from "react";

function Multiple({ question, index, onAnswerChange }) {
  const [answer, setAnswer] = useState("");
   
  const handleAnswerChange = (e) => {
    const selectedAnswer = e.target.value;
    setAnswer(selectedAnswer); 
    onAnswerChange(index, selectedAnswer); 
  };

  return (
    <div className="flex flex-col gap-5 p-10 items-center">
      <div className="text-xl font-bold">
        <span>{index + 1}.</span>
        <span>{question.title}</span>
      </div>
      {question.img && (
        <div>
          <img
            className="bg-gray-50 max-w-max w-96 h-auto rounded"
            src={question.img}
            alt=""
          />
        </div>
      )}

      <form className="font-normal text-sm flex flex-col gap-2 w-max">
        <label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`} 
            value={question.select1}
            checked={question.selected === question.select1}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select1}
        </label>
        <label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select2}
            checked={question.selected === question.select2}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select2}
        </label>
        <label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select3}
            checked={question.selected === question.select3}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select3}
        </label>
        <label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select4}
            checked={question.selected === question.select4}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select4}
        </label>
      </form>
    </div>
  );
}

export default Multiple;