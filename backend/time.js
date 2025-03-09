export const currentDate = new Date();

export const matchingTime = `${currentDate.getFullYear()}-${
  currentDate.getMonth() + 1
}-${currentDate.getDate()} 
    ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
