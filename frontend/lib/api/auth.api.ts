import axiosClinet from ".";

const authApi = {
  signIn(data: string) {
    return axiosClinet.post("/sign-in", data);
  },
};

export default authApi;
