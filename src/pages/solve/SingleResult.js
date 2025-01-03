import React from "react";

function SingleResult({ question, index }) {


  return (
    <div className="flex flex-col gap-3 p-10 ">
      <div className="text-lg font-bold">
        <span>{index + 1}.</span>
        <span>{question.title}</span>
      </div>
      {question.img && (
        <div>
          <img
            className="bg-gray-50 max-w-max w-96 h-auto"
            src={question.img}
            alt=""
          />
        </div>
      )}

      <div className="text-sm w-max"> 
      <div className={`box border font-bold rounded-lg p-2 px-5 
          ${question.answer === question.selected ? "text-blue-500" : "text-red-500"}
          `}>
          {question.selected ? question.selected : "답변안함"}
        </div>

        <div className="box text-blue-500 font-bold border rounded-lg p-2 px-5 mt-2">
          {question.answer}
        </div>
      </div>
        

      
      
    </div>
  );
}

export default SingleResult;
