import Axios, { isAxiosError } from "axios";

export const axios = Axios.create({
  baseURL: "https://control.smartrent-qa.com/api",
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      console.log("request url:", error.request.responseURL);
      console.log("response:", error.response?.status, error.response?.data);
    }

    throw error;
  }
);
