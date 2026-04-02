import styled from "styled-components";
import Card from "../common/Card";

const Stat = styled(Card)`
  padding: 1rem;
  display: grid;
  gap: 0.4rem;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  font-weight: 700;
`;

const Value = styled.strong`
  font-family: "Sora", sans-serif;
  font-size: 1.3rem;
`;

const Caption = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

function StatCard({ label, value, caption }) {
  return (
    <Stat>
      <Label>{label}</Label>
      <Value>{value}</Value>
      {caption ? <Caption>{caption}</Caption> : null}
    </Stat>
  );
}

export default StatCard;
