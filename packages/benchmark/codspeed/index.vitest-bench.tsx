import React from "react";
import { renderToString } from "react-dom/server";
import { bench, describe } from 'vitest';
import { KanjiLetterComponentYak } from "../letters/KanjiLetterComponent.next-yak.compiled";
import { KanjiLetterComponentStyled } from "../letters/KanjiLetterComponent.styled-components";


describe("KanjiLetterComponentStyled", () => {
  bench("render KanjiLetterComponentStyled", () => {
    renderToString(<KanjiLetterComponentStyled />).length;
  })
  bench("render KanjiLetterComponentYak", () => {
    renderToString(<KanjiLetterComponentYak />).length;
  })
});
