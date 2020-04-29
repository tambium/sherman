import React from "react";
import { css, Global } from "@emotion/core";

interface GlobalStyleProps {}

export const GlobalStyle: React.FC<GlobalStyleProps> = ({}) => {
  return (
    <Global
      styles={css`
        * {
          box-sizing: border-box;
        }
        html,
        body {
          font-family: "IBM Plex Mono", monospace;
          color: #2d3146;
          background-color: #fff;
        }
      `}
    />
  );
};
