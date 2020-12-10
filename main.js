/*
 * @Author: John Trump
 * @Date: 2020-12-09 19:42:28
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-10 10:35:48
 */
const cheerio = require("cheerio");
const axios = require("axios").default;
const fs = require("fs");
const URL = "http://fdc.zfj.xm.gov.cn/";

/** 获取图片并保存 */
const fetchImage = async (path, baseUrl = URL) => {
  const fileName = path.split('/')[2] || 'unknown';
  const response = await axios.get(`${baseUrl}${path}`, {
    responseType: "stream",
  });
  response.data.pipe(fs.createWriteStream(`temp/${fileName}.png`));
  return fileName;
};

/** 入口 */
async function main() {
  /** 获取 */
  const { data: html } = await axios.get(URL);
  const promises = [];
  const $ = cheerio.load(html);
  $(".imgcontainer img").each(function(i) {
    const src = $(this).attr("src");
    promises.push(fetchImage(`${src}`));
  });
  const results = await Promise.all(promises);
  console.log(results);
}

main();

// module.exports = main;
