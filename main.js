/*
 * @Author: John Trump
 * @Date: 2020-12-09 19:42:28
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-11 18:02:37
 */
const cheerio = require("cheerio");
const axios = require("axios").default;

const { writeToJSON, fetchImage } = require("./utils");
const { parse_clfjyimg } = require("./parser");
const { ocrImage } = require("./ocr");

const BASEURL = "http://fdc.zfj.xm.gov.cn/";

/** 入口 */
async function main() {
  /* fetch html */
  const { data: html } = await axios.get(BASEURL);
  const promises = [];
  const $ = cheerio.load(html);

  /* fetch images[] */
  $(".imgcontainer img").each(function(i) {
    const src = $(this).attr("src");
    promises.push(fetchImage(`${src}`, BASEURL));
  });

  /* fetch image data */
  const results = await Promise.all(promises);
  const clfjyimg = await ocrImage(results[2]);
  const parsed_clfjyimg = parse_clfjyimg(clfjyimg);

  /* write to file */
  await writeToJSON(parsed_clfjyimg);
  console.log('write success', new Date());
}

main();

// module.exports = main;
