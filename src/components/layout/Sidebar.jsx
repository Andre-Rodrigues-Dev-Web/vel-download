import { NavLink } from "react-router-dom";
import styled from "styled-components";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/downloads", label: "Downloads" },
  { to: "/history", label: "Histórico" },
  { to: "/settings", label: "Configurações" }
];

const SidebarContainer = styled.aside`
  background: ${({ theme }) => theme.colors.sidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;

const Brand = styled.div`
  padding: 0.8rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardGlass};
`;

const BrandTitle = styled.h1`
  font-family: "Sora", sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
`;

const BrandSubtitle = styled.p`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Nav = styled.nav`
  display: grid;
  gap: 0.5rem;
`;

const StyledLink = styled(NavLink)`
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.18s ease;

  &.active {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.sidebarActive};
  }
`;

function Sidebar() {
  return (
    <SidebarContainer>
      <Brand>
        <BrandTitle>Vel Download</BrandTitle>
        <BrandSubtitle>Gerenciador de transferências</BrandSubtitle>
      </Brand>

      <Nav>
        {navItems.map((item) => (
          <StyledLink key={item.to} to={item.to} end={item.to === "/"}>
            {item.label}
          </StyledLink>
        ))}
      </Nav>
    </SidebarContainer>
  );
}

export default Sidebar;
