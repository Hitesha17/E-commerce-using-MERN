import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1E3A8A", // Deep Blue
      light: "#93C5FD", // Light Blue
      dark: "#1E293B", // Dark Grayish Blue
    },
    secondary: {
      main: "#FACC15", // Yellow
      light: "#FDE047",
      dark: "#D97706",
    },
    background: {
      default: "#F9FAFB", // Light Gray Background
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1E293B", // Dark Blue Gray for better readability
      secondary: "#64748B", // Softer Gray
    },
  },

  typography: {
    fontFamily: "Inter, sans-serif",
    h1: {
      fontSize: "4rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      "@media (max-width:900px)": {
        fontSize: "3.5rem",
      },
      "@media (max-width:600px)": {
        fontSize: "2.8rem",
      },
    },
    h2: {
      fontSize: "3rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
      "@media (max-width:900px)": {
        fontSize: "2.6rem",
      },
      "@media (max-width:600px)": {
        fontSize: "2.2rem",
      },
    },
    h3: {
      fontSize: "2.5rem",
      fontWeight: 600,
      "@media (max-width:900px)": {
        fontSize: "2.2rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1.9rem",
      },
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 500,
      "@media (max-width:900px)": {
        fontSize: "1.8rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1.6rem",
      },
    },
    h5: {
      fontSize: "1.5rem",
      fontWeight: 500,
      "@media (max-width:900px)": {
        fontSize: "1.3rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1.2rem",
      },
    },
    h6: {
      fontSize: "1.25rem",
      fontWeight: 500,
      "@media (max-width:900px)": {
        fontSize: "1.1rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1rem",
      },
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      "@media (max-width:600px)": {
        fontSize: "0.95rem",
      },
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      "@media (max-width:600px)": {
        fontSize: "0.85rem",
      },
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
