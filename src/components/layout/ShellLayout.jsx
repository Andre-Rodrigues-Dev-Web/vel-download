import styled from "styled-components";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const Shell = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 270px 1fr;

  @media (max-width: 1200px) {
    grid-template-columns: 230px 1fr;
  }
`;

const Main = styled.main`
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
`;

const Content = styled.section`
  overflow: auto;
  padding: 1.2rem;
`;

function ShellLayout({ children }) {
  return (
    <Shell>
      <Sidebar />
      <Main>
        <TopBar />
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}

export default ShellLayout;
