import styled from "styled-components";
import Card from "../common/Card";

const Section = styled(Card)`
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
`;

const Title = styled.h3`
  font-size: 0.95rem;
  font-family: "Sora", sans-serif;
`;

function SettingsSection({ title, children }) {
  return (
    <Section>
      <Title>{title}</Title>
      {children}
    </Section>
  );
}

export default SettingsSection;
