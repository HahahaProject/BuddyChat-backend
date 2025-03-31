export const wrapper = (listenr) => {
  // try catch로 감싸주는게 목적.
  // 어떻게 에러핸들링을 효과적으로 할수있을까?
  return (callback) => {
    try {
      listenr(callback);
    } catch (err) {
      // sync handler
      console.log("err", err);
      callback({
        status: 500,
        message: "서버에러",
      });
    }
  };
};
