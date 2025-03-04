import axios from "axios";
import baseURL from "../util/baseURL";

const api = axios.create({
    baseURL: baseURL
})

export default api;