// src/components/Dashboard/Loading.js

import React from 'react';

const Loading = () => {
  return (
    <div className="loading-container">
      <p className="loading-text">
        로딩 중
        <span className="dot dot1">.</span>
        <span className="dot dot2">.</span>
        <span className="dot dot3">.</span>
      </p>
      <style>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh; /* 화면 전체 높이 사용 */
          background-color: #f9fafb; /* 배경색 설정 (선택 사항) */
        }

        .loading-text {
          font-size: 1.5rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          color: #374151; /* 텍스트 색상 (선택 사항) */
        }

        .dot {
          opacity: 0;
          animation: blink 1.4s infinite both;
        }

        .dot1 {
          animation-delay: 0s;
        }

        .dot2 {
          animation-delay: 0.2s;
        }

        .dot3 {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
