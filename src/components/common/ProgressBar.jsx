import styled from "styled-components";

const Track = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: ${({ theme }) => `${theme.colors.border}88`};
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  border-radius: inherit;
  width: ${({ $value }) => `${Math.min(Math.max($value, 0), 100)}%`};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.accentSecondary},
    ${({ theme }) => theme.colors.accent}
  );
  transition: width 0.25s ease;
`;

function ProgressBar({ value = 0 }) {
  return (
    <Track>
      <Fill $value={value} />
    </Track>
  );
}

export default ProgressBar;
