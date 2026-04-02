import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import DashboardPage from "./pages/DashboardPage";
import DownloadsPage from "./pages/DownloadsPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import ShellLayout from "./components/layout/ShellLayout";
import GlobalStyles from "./styles/GlobalStyles";
import { darkTheme, lightTheme } from "./styles/theme";
import { useAppContext } from "./context/AppContext";

function App() {
  const { settings } = useAppContext();
  const currentTheme = settings.theme === "light" ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <ShellLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </ShellLayout>
    </ThemeProvider>
  );
}

export default App;
