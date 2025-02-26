import React, { useState } from "react";

function Multiple({ question, index, onAnswerChange }) {
  const [answer, setAnswer] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
   
  const handleAnswerChange = (e) => {
    const selectedAnswer = e.target.value;
    setAnswer(selectedAnswer); 
    onAnswerChange(index, selectedAnswer); 
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = (e) => {
      setIsModalOpen(false);
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
            onClick={handleImageClick}
            className="bg-gray-50 max-w-max w-96 h-auto rounded" 
            src={question.img}
            alt=""
          />
        </div>
      )}

{isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={handleCloseModal}
        >
          <div className="relative">
            <img
              src={question.img}
              alt=""
              className="max-w-full max-h-full rounded"
            />
        </div>
        </div>
      )}

      <form className="font-normal text-sm flex flex-col gap-2 w-max">
        {question.select1 && (<label className="border rounded-lg p-3 pr-10">
         
         <input
           type="radio"
           name={`choice-${index}`} 
           value={question.select1}
           checked={question.selected === question.select1}
           onChange={handleAnswerChange}
           className="mx-1 bg-gray-50 border-gray-300"
         />
         {question.select1}
       </label>)}

        {question.select2 && (<label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select2}
            checked={question.selected === question.select2}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select2}
        </label>)}
        
        {question.select3 && (<label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select3}
            checked={question.selected === question.select3}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select3}
        </label>)}
        
        {question.select4 && (<label className="border rounded-lg p-3 pr-10">
          <input
            type="radio"
            name={`choice-${index}`}
            value={question.select4}
            checked={question.selected === question.select4}
            onChange={handleAnswerChange}
            className="mx-1 bg-gray-50 border-gray-300"
          />
          {question.select4}
        </label>)}
        
      </form>
    </div>
  );
}

export default Multiple;
