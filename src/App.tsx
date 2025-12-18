import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";

import VerifyEmailRequiredPage from "./pages/VerifyEmailRequiredPage";

import EmailRequiredPage from "./pages/EmailRequiredPage";


function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
  path="/verify-email-required"
  element={<VerifyEmailRequiredPage />}
/>


        <Route path="/email-required" element={<EmailRequiredPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
