import styled from "styled-components";

const Wrapper = styled.div`
  display: grid;
  gap: 0.4rem;
  place-items: center;
  padding: 2.2rem;
  border-radius: 14px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Title = styled.h4`
  font-size: 0.94rem;
  font-weight: 800;
`;

const Description = styled.p`
  font-size: 0.82rem;
  opacity: 0.9;
`;

function EmptyState({ title, description }) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
    </Wrapper>
  );
}

export default EmptyState;
