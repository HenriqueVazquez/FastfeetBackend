export default function ArrayIntersect(array1, array2) {
  const arrayJoin = [];
  const array = array1.map((response, i) => {
    arrayJoin.push(response);
    if (array2[i]) {
      arrayJoin.push(array2[i]);
    }

    return arrayJoin;
  });
  const arrays = [...new Set(array)];
  return arrays;
}
