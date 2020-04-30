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
          background-color: #fff;
          color: #2d3146;
          font-family: "IBM Plex Mono", monospace;
          font-size: 14px;
        }
      `}
    />
  );
};
