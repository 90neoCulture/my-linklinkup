const Utils = {}

/* Array.prototype.fill Polyfill By https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill */
if (!Array.prototype.fill) {
  Object.defineProperty(Array.prototype, 'fill', {
    value: function(value) {

      // Steps 1-2.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);

      // Steps 3-5.
      var len = O.length >>> 0;

      // Steps 6-7.
      var start = arguments[1];
      var relativeStart = start >> 0;

      // Step 8.
      var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

      // Steps 9-10.
      var end = arguments[2];
      var relativeEnd = end === undefined ?
        len : end >> 0;

      // Step 11.
      var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

      // Step 12.
      while (k < final) {
        O[k] = value;
        k++;
      }

      // Step 13.
      return O;
    }
  });
}

// 从数组中随机选取几条不重复的数据
Utils.arrayRandom = (arr, count) => {
  if (arr.length <= count) {
    Utils.arrayShuffle(arr)
    return arr
  }
  let set = new Set()
  return Array(count).fill(0).map(e => arrayRandomItem(arr, set))
}

// 数组随机排序
Utils.arrayShuffle = (arr) => {
  for (var j, x, i = arr.length; i; j = ~~(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  return arr
}

// 从数组中随机选一条数据，set可用于去重
const arrayRandomItem = (arr, set) => {
  let arrlen = arr.length
  let rand = ~~(Math.random() * arr.length)
  return set.has(rand) ? arrayRandomItem(arr, set) : (set.add(rand), arr[rand])
}

// 使用fill，填充数组
Utils.dyadicArrayWrap = (arr, fill) => {
  let firstRowLength = 0
  let lastRowLength = 0
  arr.forEach((row, index) => {
    if (index === 0) {
      firstRowLength = row.length + 2
    } else if (index === arr.length - 1) {
      lastRowLength = row.length + 2
    }
    row.splice(0, 0, Object.assign({}, fill).valueOf())
    row.splice(row.length, 0, Object.assign({}, fill).valueOf())
  })
  arr.splice(0, 0, Array(firstRowLength).fill(0).map(e => Object.assign({}, fill).valueOf()))
  arr.splice(arr.length, 0, Array(lastRowLength).fill(0).map(e => Object.assign({}, fill).valueOf()))
  return arr
}

// 随机填充一个指定大小的数组，并且每组数据是groupCount的倍数
Utils.arrayFillByRandomGroup = (fillCount, group, groupCount = 2) => {
  let groupLength = group.length
  let perGroup = ~~(~~(fillCount / groupLength) / groupCount) * groupCount
  let rest = fillCount - perGroup * groupLength
  let countArray = group.map((e, i) => rest / groupCount > i ? perGroup + groupCount : perGroup)
  let result = countArray.reduce((prev, curr, index) => prev.concat(Array(curr).fill(0).map(e => Object.assign({}, group[index]).valueOf())), [])
  Utils.arrayShuffle(result)
  return result
}

// 将一维数组根据col转换为二维数组
Utils.arrayToDyadic = function (arr, col) {
  let result = []
  arr.forEach((e, i) => {
    let index = ~~(i / col)
    let mod = i % col
    result[index] || (result[index] = [])
    result[index][mod] = e
  })
  return result
}

export default Utils




