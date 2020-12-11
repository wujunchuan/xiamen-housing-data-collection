/*
 * @Author: John Trump
 * @Date: 2020-12-11 17:41:06
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-11 17:42:25
 */

/**
 * Parse 二手房备案情况 clfjyimg
 * @param {string} str string data for 二手房备案情况
 */
const parse_clfjyimg = (str) => {
  const result_arr = str
    .replace(/[\r\n\s]/gm, "|")
    .split(/\|+/)
    .map((i) => {
      const arr = i.split(":");
      return arr.length > 1 ? arr[1] : arr[0];
    });

  const result = {
    /** 日期 */
    dateTime: result_arr[0],
    /** 住宅面积比例 */
    residentialAreaRatio: result_arr[1],
    /** 成交住宅套数 */
    residentialAmount: result_arr[2],
    /** 成交套数 */
    totalAmount: result_arr[3],
    /** 成交住宅面积(m^2) */
    residentialArea: result_arr[4],
    /** 成交面积(m^2) */
    totalArea: result_arr[5],
  };
  return result;
};

module.exports = {
  parse_clfjyimg
}