import React, {useState, useEffect} from 'react';
import { questionsAtom, allTagAtom } from "state/data";
import { useRecoilValue, useSetRecoilState } from "recoil";
import QuestionItem from 'pages/question/QuestionItem';
import Papa from "papaparse";

function Questions() {
    //모든 문제 전역에서 불러오기
    const questions = useRecoilValue(questionsAtom);
    const [filterQuestions, setFilterQuestions] = useState([]);
    
    //존재하는 중복 없는 모든 태그
    const allTag = useRecoilValue(allTagAtom);
    const [selectedTag, setSelectedTag] = useState([]); // 선택된 태그 상태
    
    

     // 태그 선택/해제 핸들러
    const handleTagClick = (tagName) => {
      setSelectedTag((prev) => 
        prev.includes(tagName)
          ? prev.filter((tag) => tag !== tagName) // 이미 선택된 경우 제거
          : [...prev, tagName] // 새로 선택된 경우 추가
      );
    };

    const allTagItems = allTag.map((tagName, index) => {
    const isSelected = selectedTag.includes(tagName); // 선택 여부 확인
    return (
      <div 
        onClick={() => handleTagClick(tagName)}
        key={index} 
        className={`cursor-pointer whitespace-nowrap py-1 px-2 rounded-xl text-xs font-semibold border-none ${
          isSelected ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
        }`}
      >
        {tagName}
      </div>
    );
  });


    // 태그가 변경될 때마다 필터링 실행
    useEffect(() => {
      if(selectedTag.length == 0) {
        setFilterQuestions([...questions]);
        return;
      }

      const filtered = questions.filter((question) =>
        question.tag.some((tag) => selectedTag.includes(tag))
      );
      setFilterQuestions(filtered);
      }, [questions, selectedTag]); // 의존성 배열에 `selectedTag`와 `questions` 추가

    // 동적 렌더링
    const questionsItems = filterQuestions.map((question, index) => (
      <QuestionItem key={index} question={question} />
    ));


    //csv 파일 업로드 이벤트
    const insertCSV = async (file) => {
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("CSV 파일을 찾을 수 없습니다.");
  
        const csvText = await response.text();
  
        Papa.parse(csvText, {
          header: true, // 첫 줄을 헤더로 사용
          skipEmptyLines: true, // 빈 줄 무시
          complete: (result) => {
            const tagSet = new Set(); // 태그 중복 제거용
            const today = new Date().toISOString().split("T")[0]; // 오늘 날짜
  
            const parsedData = result.data.map((item) => {
              // __parsed_extra 필드가 있으면 tag에 추가
              if (item.__parsed_extra) {
                const extraTags = item.__parsed_extra.map((tag) => tag.trim());
                item.tag = [
                  ...(item.tag ? item.tag.split(",").map((tag) => tag.trim()) : []),
                  ...extraTags,
                ];
              } else if (item.tag) {
                // tag가 문자열 형태로 존재하면 리스트로 변환
                item.tag = item.tag.split(",").map((tag) => tag.trim());
              }
              item.tag?.forEach((tag) => tagSet.add(tag)); // 태그 중복 제거
  
              // 필요한 필드만 유지, 기본값 설정
              return {
                title: item.title || "",
                type: item.type || "",
                select1: item.select1 || "",
                select2: item.select2 || "",
                select3: item.select3 || "",
                select4: item.select4 || "",
                answer: item.answer || "",
                img: item.img || "",
                level: 0, // 기본값
                date: today, // 오늘 날짜
                tag: item.tag || [],
              };
            });
  
            // 기존 questions 배열에 새 데이터를 추가
            setQuestions([...parsedData, ...questions]);
            setAlltag([...tagSet, ...allTag]);

          },
        });
      } catch (error) {
        console.error("CSV 파일 읽기 실패:", error);
      }
    };
    
    const handleFileUpload = (event) => {
    const file = event.target.files[0]; // 사용자가 업로드한 파일
    if (file) {
      const fileUrl = URL.createObjectURL(file); // 파일 URL 생성
      insertCSV(fileUrl); // insertQuestion 함수 호출
      }
    };

    const handleDownload = () => {
      // questions 배열을 CSV로 변환
      const csv = Papa.unparse(filterQuestions, {
        header: true, // 첫 번째 줄에 헤더 포함
      });
  
      // Blob을 사용하여 CSV 데이터를 파일로 변환
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  
      // 다운로드 링크 생성
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "questions.csv"); // 다운로드할 파일 이름 설정
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click(); // 다운로드 실행
        document.body.removeChild(link); // 링크 제거
      }
    };



    


    //이미지 업로드 이벤트
    const [thumbnail, setThumbnail] = useState(null);
    const handleFileChange = (event) => {
      const image = event.target.files[0];
      if (image) {
        const reader = new FileReader();
        reader.onload = () => {
          setThumbnail(reader.result);
        };
        reader.readAsDataURL(image);
      }
    };
    

    //좌측 사이드바 토글
    const [isCollapsed, setIsCollapsed] = useState(true);
    //문제추가모달 토글
    const [insertModal, setInsertModal] = useState(false);

    //문제추가폼
    const [title, setTitle] = useState("");
    const [type, setType] = useState("객관식");
    const [select1, setSelect1] = useState("");
    const [select2, setSelect2] = useState("");
    const [select3, setSelect3] = useState("");
    const [select4, setSelect4] = useState("");
    const [answer, setAnswer] = useState("");
    const [tag, setTag] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const setQuestions = useSetRecoilState(questionsAtom);
    const setAlltag = useSetRecoilState(allTagAtom);

    const insertEvent = () => {
      const tags = tag ? [...new Set(tag.split(",").map((item) => item.trim()))] : [];

      const question = {
        title,
        type,
        select1,
        select2,
        select3,
        select4,
        answer,
        img: thumbnail,
        level:0,
        date,
        tag:tags,
      };
  
      setTitle("");
      setSelect1("");
      setSelect2("");
      setSelect3("");
      setSelect4("");
      setAnswer("");
      setThumbnail(null);

      setQuestions((prevQuestions) => [question, ...prevQuestions]);
    };

      return (

        <main className="ml-20 flex">

          <div
            className={`fixed h-full ${
              isCollapsed ? "border-r" : "w-80"
            } rounded-r-xl  flex flex-col items-center shadow bg-gray-100 transition-all duration-500`}
          >

              <div
                className="cursor-pointer text-gray-400 w-full text-right p-2"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-5 inline"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>

              </div>

            <div className="hidden w-full p-5 ">
              

              {!isCollapsed && <div className="font-bold">문제검색</div>}
              {!isCollapsed && (
                <input
                  type="text"
                  className="border-gray-300 border-1 rounded py-1 w-full mt-3 text-sm"
                />
              )}
          </div>

            {!isCollapsed && (
              <div 
               className="w-full p-5 h-max overflow-auto css-tag-scroll">
                <div 
                className="font-bold">문제집 선택</div>
                <div className="flex gap-2 py-2 w-full flex-wrap">
                  {allTagItems}
                  
                </div>
              </div>
            )}
          </div>         
          

          <div className={`mb-[300px] transition-all duration-500 flex-1 sm:rounded-lg ${
              isCollapsed ? "ml-10" : "ml-80"
            }`}>

            <div className="px-8 py-4 flex justify-between border-b">
              <div>
                <h1 className="text-2xl font-semibold">문제 관리</h1>
                <h1 className="text-md font-normal text-gray-400">총 {filterQuestions.length} 문제</h1>
              </div>
              <div className="bg-white items-center flex">
                <div 
                onClick={() => setInsertModal(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs h-8 w-24 inline-flex items-center justify-center me-2 mb-2">
                    문제추가
                </div>
                <div 
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-full text-xs h-8 w-8 inline-flex items-center justify-center me-2 mb-2">
                  
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4 absolute"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <input 
                  onChange={handleFileUpload}
                  type='file' accept='.csv' className='opacity-0 h-full w-full'></input>

                </div>
                <div 
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-full text-xs h-8 w-8 inline-flex items-center justify-center me-2 mb-2">
                <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-4 absolute"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                        clipRule="evenodd"
                      />
                  </svg>
                </div>
              </div>
            </div>

            <table className="text-left rtl:text-right text-gray-500 m-5 rounded-xl bg-gray-50 " >
              <thead className="text-sm font-bold text-gray-700 uppercase border-b">
                <tr className="px-10 bg-gray-100">
                  <th scope="col" className="py-4 px-8 rounded-tl-xl">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 w-full">
                    문제
                  </th>
                  
                  <th scope="col" className="px-6 py-3 whitespace-nowrap">
                    유형
                  </th>
                  <th scope="col" className="px-6 py-3 rounded-tr-xl"></th>
                </tr>
              </thead>
              <tbody>
                {questionsItems}
                <tr>
                  <td 
                    className='rounded-b-xl h-10 bg-gray-50'
                    colSpan={4}></td>
                </tr>
              </tbody>
            </table>
          </div>



            
          <div className={`
              ${insertModal ? "h-[300px]" : "h-0" }
                transition-all width-fill-available shadow-[10px_0px_10px_10px_rgba(0,0,0,0.1)] rounded-t-2xl duration-500 fixed bottom-0 bg-white  ${
                  isCollapsed ? "ml-10" : "ml-80"
                }`}
              >
                <div className="h-full w-full p-7 flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="font-bold text-xl pl-1">문제 추가하기</div>
        <div className="items-center flex">
          <div
            onClick={insertEvent}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs h-8 w-24 inline-flex items-center justify-center me-2"
          >
            저장하기
          </div>
          <div
            onClick={() => setInsertModal(false)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-full text-xs h-8 w-8 inline-flex items-center justify-center me-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>
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
        placeholder="태그를 입력해주세요"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
      />
      <div className="flex gap-5">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-3">
            <input
              type="radio"
              name="answer"
              onChange={() => setAnswer(select1)}
            />
            <input
              type="text"
              className="flex-1 block text-sm h-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
              placeholder="선택지1"
              value={select1}
              onChange={(e) => setSelect1(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <input
              type="radio"
              name="answer"
              onChange={() => setAnswer(select2)}
            />
            <input
              type="text"
              className="flex-1 block text-sm h-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
              placeholder="선택지2"
              value={select2}
              onChange={(e) => setSelect2(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-3">
            <input
              type="radio"
              name="answer"
              onChange={() => setAnswer(select3)}
            />
            <input
              type="text"
              className="flex-1 block text-sm h-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
              placeholder="선택지3"
              value={select3}
              onChange={(e) => setSelect3(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <input
              type="radio"
              name="answer"
              onChange={() => setAnswer(select4)}
            />
            <input
              type="text"
              className="flex-1 block text-sm h-10 outline-none border-b-2 border-gray-200 focus:border-blue-500 px-3"
              placeholder="선택지4"
              value={select4}
              onChange={(e) => setSelect4(e.target.value)}
            />
          </div>
        </div>
        <div
          className="bg-gray-50 flex rounded"
          style={{
            backgroundImage: thumbnail ? `url(${thumbnail})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <input
            type="file"
            accept=".jpg, .jpeg, .png"
            className="w-full h-full text-xs opacity-0"
            onChange={handleFileChange}
          />
        </div>
      </div>
     
    </div>
           
            
          </div>




        </main>
      
  
      );
    
}

export default Questions;