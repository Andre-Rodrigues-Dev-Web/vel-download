import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: "Manrope", "Segoe UI", sans-serif;
    color: ${({ theme }) => theme.colors.textPrimary};
    background:
      radial-gradient(circle at 85% 15%, rgba(34, 211, 238, 0.18), transparent 35%),
      radial-gradient(circle at 20% 75%, rgba(74, 222, 128, 0.14), transparent 34%),
      ${({ theme }) => theme.gradient};
  }

  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;

export default GlobalStyles;
