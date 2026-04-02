import styled from "styled-components";

const Card = styled.section`
  background: ${({ theme }) => theme.colors.cardGlass};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  box-shadow: ${({ theme }) => theme.shadow};
  backdrop-filter: blur(10px);
`;

export default Card;
