import { atom } from "recoil";

const questionsAtom = atom({
  key: "questions", // Atom의 고유 키
  default: [], // 초기 상태
})

const allTagAtom = atom({
  key: "allTag", // Atom의 고유 키
  default: [], // 초기 상태
})

export const historyDataAtom = atom({
  key: "historyDataAtom",
  default: [],
});

export const recommendedQuestionsAtom = atom({
  key: "recommendedQuestionsAtom",
  default: [],
});

export {questionsAtom, allTagAtom};
