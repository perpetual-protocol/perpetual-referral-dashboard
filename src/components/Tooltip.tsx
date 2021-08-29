import React, { ReactElement } from "react";
import Tippy from "@tippyjs/react/headless";
import QuestionMark from '../assets/question-mark.svg';

type Props = {
    content: ReactElement;
};

export default function Tooltip({ content }: Props) {
  return (
    <Tippy
      render={(attrs) => (
        <div className="bg-perp-gray-200 p-2 rounded-lg text-white text-sm" tabIndex={-1} {...attrs}>
          {content}
        </div>
      )}
    >
      <button className='text-sm'><QuestionMark /></button>
    </Tippy>
  );
}
