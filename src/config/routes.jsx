import { Navigate } from "react-router-dom";
import Login from "../pages/Login";
export const routes = [
    {
        name: "Login",
        path: "login",
        element: <Login />
    },
]