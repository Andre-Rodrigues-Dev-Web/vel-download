import styled from "styled-components";

const toneMap = {
  accent: "accent",
  success: "success",
  danger: "danger",
  warning: "warning",
  textSecondary: "textSecondary"
};

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.24rem 0.68rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid ${({ theme, $tone = "textSecondary" }) => theme.colors[toneMap[$tone] || "textSecondary"]};
  color: ${({ theme, $tone = "textSecondary" }) => theme.colors[toneMap[$tone] || "textSecondary"]};
  background: ${({ theme, $tone = "textSecondary" }) => {
    const color = theme.colors[toneMap[$tone] || "textSecondary"];
    return `${color}18`;
  }};
`;

export default Badge;
