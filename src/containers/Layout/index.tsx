import React from "react";
import { Header, Routes } from "./components";

const year = new Date().getFullYear();

export const Layout = () => {
  return (
    <div className="layoutElement">
      <Header />
      <Routes />

      <p className="footerText">
        Copyrighted &copy; {year} - Basilisk Entertainment S.R.L
      </p>
    </div>
  );
};
