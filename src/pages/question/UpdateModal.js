import React, { useState, useEffect, useRef } from "react";
import { questionsAtom } from "state/data";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { generateUniqueId } from "utils/util";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { appPathAtom } from "state/data";

function UpdateModal({
  setUpdateModal,
  question,
  setUpdateQuestion,
  isCollapsed,
  index,
  expanded,
}) {
  const appPath = useRecoilValue(appPathAtom);

  const placeholderImage = "./images/insertImg.png";

  const [title, setTitle] = useState(question.title || "");
  const [type, setType] = useState(question.type || "객관식");
  const [select1, setSelect1] = useState(question.select1 || "");
  const [select2, setSelect2] = useState(question.select2 || "");
  const [select3, setSelect3] = useState(question.select3 || "");
  const [select4, setSelect4] = useState(question.select4 || "");
  const [answer, setAnswer] = useState(question.answer || "");
  const [tag, setTag] = useState(question.tag.join(", ") || "");
  const [date, setDate] = useState(question.date || "");
  const [description, setDescription] = useState(question.description || "");
  const getInitialOptionIndex = () => {
    const options = [
      question.select1,
      question.select2,
      question.select3,
      question.select4,
    ];
    return options.findIndex((opt) => opt === question.answer);
  };
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(
    type === "객관식" ? getInitialOptionIndex() : -1
  );

  // thumbnail 상태를 설정할 때, 경로를 보정하는 헬퍼 함수 추가
  // const getProperImageUrl = (path) => {
  //   if (!path) return placeholderImage;
  //   // Windows의 역슬래시를 슬래시로 변경
  //   let normalizedPath = path.replace(/\\/g, "/");
  //   // 이미 "file://"로 시작하지 않는다면 file:/// 접두어 추가
  //   if (!normalizedPath.startsWith("file://")) {
  //     normalizedPath = `file:///${normalizedPath}`;
  //   }
  //   return normalizedPath;
  // };

  const [thumbnail, setThumbnail] = useState(question.img || placeholderImage);
  const [imageFile, setImageFile] = useState(null);

  const setQuestions = useSetRecoilState(questionsAtom);
  const questions = useRecoilValue(questionsAtom);

  // 드래그 앤 드롭 관련 state 및 ref
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const uploadImage = "./images/uploadImg.png"; // 드롭시 배경 이미지

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnail(reader.result);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleFileChange = (event) => {
    const image = event.target.files[0];
    if (image) {
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnail(reader.result);
        // 파일 입력 리셋: 같은 파일 재선택 시 이벤트 발생 보장
        event.target.value = null;
      };
      reader.readAsDataURL(image);
      setImageFile(image);
    }
  };

  const handleRemoveImage = () => {
    setThumbnail(placeholderImage);
    setImageFile(null);
  };

  async function handleSave(id, file) {
    try {
      const result = await window.electronAPI.saveImage(id, file);
      return result; // 저장 결과 반환
    } catch (error) {
      console.error("이미지 저장 중 오류 발생:", error);
      return { success: false, error: error.message };
    }
  }

  const updateEvent = async () => {
    if (!title) {
      if (!toast.isActive("update-title-error")) {
        toast.error("제목은 필수 입력 항목입니다", {
          toastId: "update-title-error",
        });
      }
      return;
    }

    if (type === "객관식") {
      // 선택된 옵션이 없을 경우
      if (selectedOptionIndex === -1) {
        if (!toast.isActive("update-multi")) {
          toast.error("객관식 답안을 설정해주세요", {
            toastId: "update-multi",
          });
        }
        return;
      }
      // 선택된 옵션의 텍스트가 비어있을 경우
      const options = [select1, select2, select3, select4];
      if (
        !options[selectedOptionIndex] ||
        options[selectedOptionIndex].trim() === ""
      ) {
        if (!toast.isActive("update-multi-empty")) {
          toast.error("선택된 객관식 답안이 비어있습니다", {
            toastId: "update-multi-empty",
          });
        }
        return;
      }
    }

    if (type === "주관식" && answer.trim() === "") {
      if (!toast.isActive("update-multi")) {
        toast.error("정답을 입력해주세요", { toastId: "update-multi" });
      }
      return;
    }
    const tags = tag
      ? [...new Set(tag.split(",").map((item) => item.trim()))]
      : [];

    const finalAnswer =
      type === "객관식"
        ? [select1, select2, select3, select4][selectedOptionIndex]
        : answer;

    const updatedQuestion = {
      ...question,
      title,
      type,
      select1,
      select2,
      select3,
      select4,
      answer: finalAnswer,
      description,
      img: question.img,
      date,
      tag: tags,
    };

    if (imageFile) {
      // 기존 이미지가 있으면 삭제 (삭제에 실패해도 진행할 수 있도록 try-catch)
      if (question.img) {
        try {
          const deleteResult = await window.electronAPI.deleteImage(
            question.img
          );
          if (!deleteResult.success) {
            console.error("기존 이미지 삭제 실패:", deleteResult.message);
            // 삭제 실패 시 추가 처리가 필요하면 여기서 처리
          }
        } catch (error) {
          console.error("기존 이미지 삭제 중 오류 발생:", error);
        }
      }

      // 새 파일 이름 생성 (questions 배열을 활용)
      const newFileName = generateUniqueId(questions);

      try {
        const result = await handleSave(newFileName, imageFile);
        if (result.success) {
          updatedQuestion.img = result.path;
          // 이미지 저장 후 파일 상태 초기화
          setImageFile(null);
        } else {
          console.error("이미지 저장 실패:", result.error);
          if (!toast.isActive("saving-image-false")) {
            toast.error("이미지 저장에 실패했습니다.", {
              toastId: "saving-image-false",
            });
          }
          return;
        }
      } catch (error) {
        console.error("이미지 저장 중 오류 발생:", error);
        if (!toast.isActive("saving-image-error")) {
          toast.error("이미지 저장 중 오류가 발생했습니다.", {
            toastId: "saving-image-error",
          });
        }
        return;
      }
    } else {
      updatedQuestion.img = question.img;
    }

    // 질문 업데이트
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[index] = updatedQuestion;
      return updatedQuestions;
    });

    setUpdateQuestion(null);
    setUpdateModal(false);
  };

  const updateCancleEvent = () => {
    setUpdateQuestion(null);
    setUpdateModal(false);
  };

  useEffect(() => {
    setTitle(question.title || "");
    setType(question.type || "객관식");
    setSelect1(question.select1 || "");
    setSelect2(question.select2 || "");
    setSelect3(question.select3 || "");
    setSelect4(question.select4 || "");
    if (question.type === "주관식") {
      setAnswer(question.answer || "");
    }
    setTag(question.tag.join(", ") || "");
    setDate(question.date || "");
    setDescription(question.description || "");
    setThumbnail(question.img || null);

    // 객관식일 경우, 기존 정답 문자열에서 인덱스를 재설정
    if (question.type === "객관식") {
      const options = [
        question.select1,
        question.select2,
        question.select3,
        question.select4,
      ];
      const idx = options.findIndex((opt) => opt === question.answer);
      setSelectedOptionIndex(idx);
    }
  }, [question, appPath]);

  const updateCancelEvent = () => {
    setUpdateQuestion(null);
    setUpdateModal(false);
  };

  //x 버튼 공통 이미지 업로드 컴포넌트
  const renderImageUpload = () => (
    <div
      className={`relative bg-gray-50 min-h-[150px] flex rounded h-full`}
      style={{
        backgroundImage: thumbnail
          ? `url("${appPath + thumbnail}")`
          : `url(${placeholderImage})`,
        backgroundSize: "100% 100%", // 여기서 100% 비율로 맞춤
        backgroundPosition: "center",
      }}
    >
      {thumbnail && thumbnail !== placeholderImage && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1 text-xs z-10 transform transition duration-300 hover:scale-105"
        >
          삭제
        </button>
      )}
      <input
        type="file"
        accept=".jpg, .jpeg, .png"
        className="w-full h-full text-xs opacity-0"
        onChange={handleFileChange}
      />
    </div>
  );

  return (
    <div
      className="h-full w-full p-7 flex flex-col gap-2"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-50 pointer-events-none rounded-xl"
          style={{
            backgroundImage: `url(${uploadImage})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <span className="text-white text-xl">
            파일을 놓으면 이미지가 업로드 됩니다
          </span>
        </div>
      )}

      {expanded ? (
        // expanded 상태: 세로로 나열
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="font-bold text-xl pl-1">문제 수정하기</div>
            <div className="flex items-center gap-2">
              <div
                onClick={updateEvent}
                className="cursor-pointer bg-blue-500 transition hover:scale-105 text-white font-semibold rounded-2xl text-xs h-8 w-24 inline-flex items-center justify-center"
              >
                저장하기
              </div>
              <div
                onClick={updateCancelEvent}
                className="cursor-pointer bg-blue-500 transition hover:scale-105 text-white font-semibold rounded-full text-xs h-8 w-8 inline-flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <input
                type="text"
                className="block min-w-[50%] outline-none border-b-2 border-gray-200 focus:border-blue-500 text-sm px-2 py-1 h-10"
                placeholder="문제를 입력해주세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <select
                className="block border-b-2 text-sm px-2 py-1 h-10 outline-none border-gray-200 focus:border-blue-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="객관식">객관식</option>
                <option value="주관식">주관식</option>
              </select>
            </div>
            <input
              type="text"
              className="block outline-none border-b-2 border-gray-200 focus:border-blue-500 text-sm px-2 py-1 h-10 w-1/2"
              placeholder="문제집 또는 태그를 입력해주세요"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            {type === "객관식" ? (
              // 객관식 입력폼
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    className="focus:outline-blue-500"
                    type="radio"
                    name="answer"
                    checked={selectedOptionIndex === 0}
                    onChange={() => setSelectedOptionIndex(0)}
                  />
                  <textarea
                    rows="3"
                    maxLength={300}
                    className="flex-1 block text-sm leading-6 border-2 rounded-md border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1 resize-none"
                    placeholder="선택지1"
                    value={select1}
                    onChange={(e) => setSelect1(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    className="focus:outline-blue-500"
                    type="radio"
                    name="answer"
                    checked={selectedOptionIndex === 1}
                    onChange={() => setSelectedOptionIndex(1)}
                  />
                  <textarea
                    rows="3"
                    maxLength={300}
                    className="flex-1 block text-sm leading-6 border-2 rounded-md border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1 resize-none"
                    placeholder="선택지2"
                    value={select2}
                    onChange={(e) => setSelect2(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    className="focus:outline-blue-500"
                    type="radio"
                    name="answer"
                    checked={selectedOptionIndex === 2}
                    onChange={() => setSelectedOptionIndex(2)}
                  />
                  <textarea
                    rows="3"
                    maxLength={300}
                    className="flex-1 block text-sm leading-6 border-2 rounded-md border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1 resize-none"
                    placeholder="선택지3"
                    value={select3}
                    onChange={(e) => setSelect3(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    className="focus:outline-blue-500"
                    type="radio"
                    name="answer"
                    checked={selectedOptionIndex === 3}
                    onChange={() => setSelectedOptionIndex(3)}
                  />
                  <textarea
                    rows="3"
                    maxLength={300}
                    className="flex-1 block text-sm leading-6 border-2 rounded-md border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1 resize-none"
                    placeholder="선택지4"
                    value={select4}
                    onChange={(e) => setSelect4(e.target.value)}
                  />
                </div>
                {/* 여기서 "설명" 입력 영역과 이미지 업로드 영역을 나란히 배치 */}
                <div className="flex flex-1 gap-4">
                  <textarea
                    rows="5"
                    maxLength={300}
                    placeholder="설명"
                    className="w-2/3 border-2 outline-none text-sm border-gray-200 px-2 py-1 rounded-md focus:border-blue-500 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                  <div className="w-1/3 h-full transform transition duration-300 hover:scale-105">
                    {renderImageUpload()}
                  </div>
                </div>
              </div>
            ) : (
              // 주관식 입력폼
              <div className="mt-3 flex flex-col gap-3">
                <textarea
                  rows="9"
                  maxLength={800}
                  className="flex-1 block text-sm border-2 px-2 py-1 rounded-md border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="정답"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <textarea
                  rows="5"
                  maxLength={300}
                  placeholder="설명을 입력해주세요"
                  className="block text-sm border-2 rounded-md outline-none px-2 py-1 border-gray-200 focus:border-blue-500 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                <div className="flex-1 mx-auto mt-4 transform transition duration-300 hover:scale-105">
                  {renderImageUpload()}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-[2]">
            <div className="flex justify-between">
              <div className="font-bold text-xl pl-1">문제 수정하기</div>
              <div className="items-center flex">
                <div
                  onClick={updateEvent}
                  className="cursor-pointer bg-blue-500 transition hover:scale-105 text-white font-semibold rounded-2xl text-xs h-8 w-24 inline-flex items-center justify-center me-2"
                >
                  저장하기
                </div>
                <div
                  onClick={() => updateCancleEvent()}
                  className="cursor-pointer bg-blue-500 transition hover:scale-105 text-white font-semibold rounded-full text-xs h-8 w-8 inline-flex items-center justify-center me-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-[2]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="block min-w-[50%] outline-none border-b-2 border-gray-200 focus:border-blue-500 text-sm px-2 py-1 h-10"
                    placeholder="문제를 입력해주세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <select
                    className="block border-b-2 text-sm px-2 py-1 h-10 outline-none border-b-2 border-gray-200 focus:border-blue-500"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="객관식">객관식</option>
                    <option value="주관식">주관식</option>
                  </select>
                </div>

                <input
                  type="text"
                  className="block outline-none border-b-2 border-gray-200 focus:border-blue-500 text-sm px-2 py-1 h-10 w-1/2 flex-none"
                  placeholder="문제집 또는 태그를 입력해주세요"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
                {type === "객관식" ? (
                  <div className="flex gap-5">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex gap-3">
                        <input
                          className="focus:outline-blue-500"
                          type="radio"
                          name="answer"
                          checked={selectedOptionIndex === 0}
                          onChange={() => setSelectedOptionIndex(0)}
                        />
                        <textarea
                          rows="1"
                          maxLength={300}
                          className="flex-1 block text-sm h-10 leading-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
                          style={{
                            resize: "none",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                          placeholder="선택지1"
                          value={select1}
                          onChange={(e) => setSelect1(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              !expanded &&
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              e.target.value.split("\n").length === 1
                            ) {
                              e.preventDefault();
                              updateEvent();
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <input
                          className="focus:outline-blue-500"
                          type="radio"
                          name="answer"
                          checked={selectedOptionIndex === 1}
                          onChange={() => setSelectedOptionIndex(1)}
                        />
                        <textarea
                          rows="1"
                          maxLength={300}
                          className="flex-1 block text-sm h-10 leading-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
                          style={{
                            resize: "none",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                          placeholder="선택지2"
                          value={select2}
                          onChange={(e) => setSelect2(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              !expanded &&
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              e.target.value.split("\n").length === 1
                            ) {
                              e.preventDefault();
                              updateEvent();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex gap-3">
                        <input
                          className="focus:outline-blue-500"
                          type="radio"
                          name="answer"
                          checked={selectedOptionIndex === 2}
                          onChange={() => setSelectedOptionIndex(2)}
                        />
                        <textarea
                          rows="1"
                          maxLength={300}
                          className="flex-1 block text-sm h-10 leading-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
                          style={{
                            resize: "none",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                          placeholder="선택지3"
                          value={select3}
                          onChange={(e) => setSelect3(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              !expanded &&
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              e.target.value.split("\n").length === 1
                            ) {
                              e.preventDefault();
                              updateEvent();
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <input
                          className="focus:outline-blue-500"
                          type="radio"
                          name="answer"
                          checked={selectedOptionIndex === 3}
                          onChange={() => setSelectedOptionIndex(3)}
                        />
                        <textarea
                          rows="1"
                          maxLength={300}
                          className="flex-1 block text-sm h-10 leading-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
                          style={{
                            resize: "none",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                          placeholder="선택지4"
                          value={select4}
                          onChange={(e) => setSelect4(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              !expanded &&
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              e.target.value.split("\n").length === 1
                            ) {
                              e.preventDefault();
                              updateEvent();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-[6px] ">
                    <textarea
                      rows="4"
                      maxLength={800}
                      className="flex-1 block text-sm outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3 resize-none"
                      placeholder="정답"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-1 mt-4 transform justify-center transition duration-300 hover:scale-105">
                {renderImageUpload()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default UpdateModal;
