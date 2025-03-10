import React, { useEffect, useState } from 'react';
import { appPathAtom } from "state/data";
import { useRecoilValue } from "recoil";


function QuestionItem({ question, onUpdateClick, handleCheckboxChange }) {
  const appPath = useRecoilValue(appPathAtom);
  const tags = question.tag || [];
  const tag = tags.map((tagName, index) => <span key={index} className="font-medium text-xs whitespace-nowrap bg-gray-200 rounded-xl py-1 px-2">{tagName}</span>);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggle = () => { setIsCollapsed((state) => !(state)) }

  const [isChecked, setIsChecked] = useState(question.checked || false); // 기본값 설정
  useEffect(() => {
    setIsChecked(question.checked);
  }, [question]);

  const updateClick = (event) => {
    event.stopPropagation();
    onUpdateClick();
  };

  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const Modal = ({ imgSrc, onClose }) => {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="relative">
          <img
            src={imgSrc}
            alt="Preview"
            onClick={onClose}
            className="max-h-[80vh] max-w-[80vw] rounded"
          />
        </div>
      </div>
    );
  };

  if (question.type === '주관식') {
    return (
      <>
        <tr onClick={toggle} className={`${!isCollapsed && "border-b hover:shadow"} transition-all cursor-pointer`}>
          <td className="w-4 p-4 align-top py-4 px-8">
            <div className="flex items-center ">
              <input
                id="checkbox-table-search-1"
                type="checkbox"
                checked={!!isChecked} // boolean 
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-blue-600 cursor-pointer bg-gray-100 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </td>
          <td className="flex items-center px-6 py-4 text-gray-900 ">
            <div className="flex-1">
              <div className="text-base font-bold">{question.title}</div>
              <div className="flex gap-1 mt-2">{tag}</div>
            </div>
          </td>
          <td className="hidden px-6 py-4 align-top">
            <div className="flex gap-1">{tag}</div>
          </td>
          <td className="px-6 py-4 align-top ">
            <div className="font-medium text-sm whitespace-nowrap">{question.type}</div>
          </td>
          <td className="px-3 py-2 align-top">
            <div
              onClick={(e) => updateClick(e)}

              className="cursor-pointer rounded-xl hover:font-bold hover:bg-gray-100 w-max text-xs cursor-pointer text-blue-600 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>
            </div>
          </td>
        </tr>
        <tr className={` hover:shadow transition-all duration-500 ${isCollapsed ? "border-b" : ""}`}>
          <td></td>
          <td className="overflow-hidden">
            <div
              className={`flex transition-all duration-500 ease-in-out ${isCollapsed ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="flex-1 font-normal text-sm text-gray-500 flex flex-col px-6 pb-3 gap-2">
                <div className="border bg-white rounded-lg p-2.5 px-4">
                  {question.answer}
                </div>

              </div>

            </div>
          </td>
          <td colSpan={2} className="overflow-hidden">
            <div
              className={`flex transition-all duration-500 ease-in-out ${isCollapsed ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >

              {question.img && (
                <div className="p-5 px-6">
                  <img
                    src={ appPath + question.img}
                    onClick={openModal}
                    className="rounded aspect-video min-w-[10vw] max-w-[20vw]"
                    alt="미리보기"
                  />
                </div>
              )}
            </div>
          </td>
        </tr>
        {showModal && <Modal imgSrc={appPath + question.img} onClose={closeModal} />}
      </>
    );
  }

  return (
    <>
      <tr onClick={toggle} className={`${!isCollapsed && "border-b hover:shadow"} transition-all `}>
        <td className="w-4 p-4 align-top py-4 px-8">
          <div className="flex items-center ">
            <input
              id="checkbox-table-search-1"
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </td>
        <td className="flex items-center px-6 py-4 text-gray-900 ">
          <div className="flex-1">
            <div className="text-base font-bold">{question.title}</div>
            <div className="flex gap-1 mt-2">{tag}</div>
          </div>
        </td>
        <td className="hidden px-6 py-4 align-top">
          <div className="flex gap-1">{tag}</div>
        </td>
        <td className="px-6 py-4 align-top ">
          <div className="font-medium text-sm whitespace-nowrap">{question.type}</div>
        </td>
        <td className="px-3 py-2 align-top">
          <div
            onClick={(e) => updateClick(e)}
            className="cursor-pointer rounded-xl hover:font-bold hover:bg-gray-100 w-max text-xs cursor-pointer text-blue-600 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>
          </div>
        </td>
      </tr>
      <tr className={` hover:shadow transition-all duration-500 ${isCollapsed ? "border-b" : ""}`}>
        <td></td>
        <td className="overflow-hidden">
          <div
            className={`flex transition-all duration-500 ease-in-out ${isCollapsed ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="flex-1 font-normal text-sm text-gray-500 flex flex-col px-6 pb-3 gap-2">
              {question.select1 && (<div
                className={`border bg-white rounded-lg p-2.5 px-4 ${question.select1 === question.answer ? "font-bold text-blue-500" : ""
                  }`}
              >
                {question.select1}
              </div>)}

              {question.select2 && (<div
                className={`border bg-white rounded-lg p-2.5 px-4 ${question.select2 === question.answer ? "font-bold text-blue-500" : ""
                  }`}
              >
                {question.select2}
              </div>)}

              {question.select3 && (<div
                className={`border bg-white rounded-lg p-2.5 px-4 ${question.select3 === question.answer ? "font-bold text-blue-500" : ""
                  }`}
              >
                {question.select3}
              </div>)}

              {question.select4 && (<div
                className={`border bg-white rounded-lg p-2.5 px-4 ${question.select4 === question.answer ? "font-bold text-blue-500" : ""
                  }`}
              >
                {question.select4}
              </div>)}
            </div>
          </div>
        </td>
        <td colSpan={2} className="overflow-hidden">
          <div
            className={`flex transition-all duration-500 ease-in-out ${isCollapsed ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >

            {question.img && (
              <div className="p-5 px-6">
                <img
                  src={ appPath + question.img}
                  onClick={openModal}
                  className="rounded aspect-video min-w-[10vw] max-w-[20vw] cursor-pointer"
                  alt="미리보기"
                />
              </div>
            )}
          </div>
        </td>
      </tr>
      {showModal && <Modal imgSrc={appPath + question.img} onClose={closeModal} />}
    </>

  );

}

export default QuestionItem;