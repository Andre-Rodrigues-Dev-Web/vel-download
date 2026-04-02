import styled, { css } from "styled-components";

const toneStyles = {
  primary: css`
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentSecondary});
    color: #032113;
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.cardBackground};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textPrimary};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.danger};
    color: #fff;
  `,
  ghost: css`
    background: transparent;
    border: 1px dashed ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textSecondary};
  `
};

const StyledButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.58rem 0.95rem;
  font-weight: 700;
  font-size: 0.86rem;
  cursor: pointer;
  transition: transform 0.16s ease, opacity 0.16s ease, box-shadow 0.2s ease;
  box-shadow: ${({ theme }) => theme.shadow};

  &:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
  }

  ${({ $tone = "secondary" }) => toneStyles[$tone] || toneStyles.secondary}
`;

function Button({ children, tone = "secondary", type = "button", ...props }) {
  return (
    <StyledButton type={type} $tone={tone} {...props}>
      {children}
    </StyledButton>
  );
}

export default Button;
