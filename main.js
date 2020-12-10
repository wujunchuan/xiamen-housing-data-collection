/*
 * @Author: John Trump
 * @Date: 2020-12-09 19:42:28
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-10 18:02:19
 */
const cheerio = require("cheerio");
/* https://www.npmjs.com/package/tesseract.js */
const { createWorker, PSM } = require("tesseract.js");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const gm = require("gm");

const URL = "http://fdc.zfj.xm.gov.cn/";

/** tesseract worker */
const worker = createWorker({
  logger: (m) => {
    process.env.NODE_ENV === "production" ? undefined : console.log(m);
  },
});

/**
 * 获取图片并保存
 * @param {string} path image path, exclude baseUrl
 * @param {string} baseUrl baseUrl, default is equal to {URL}
 */
const fetchImage = async (path, baseUrl = URL) => {
  let fileName = path.split("/")[2] || "unknown";
  const response = await axios.get(`${baseUrl}${path}`, {
    responseType: "stream",
  });

  /* remove random stamp */
  fileName = fileName.replace(/(\?id=\-?\w+)/gm, '');

  response.data.pipe(fs.createWriteStream(`temp/${fileName}.png`));
  return fileName;
};

/** 对图片进行处理, 以便可以 tesseract 可以更好的识别图片 */
const reviseImg = async (src) => {
  return new Promise((resolve, reject) => {
    /* set `.gm.jpg` flag to mark as handled picture */
    let output = src.replace(/(\.\w+)$/, ".gm.jpg");
    gm(src)
      .resample(300, 300)
      .flatten()
      .threshold(22, "%")
      .write(output, (err) => (err ? reject(err) : resolve(output)));
  });
};

/**
 * 提取文字内容
 * @param {'clfjyimg' | 'spftjimg' | 'spfjsimg'} fileName 文件名称
 */
const ocrImage = async (fileName) => {
  // 一手房分区情况 spfjsimg.png
  // 一手房整体情况 spftjimg.png
  // 二手房备案情况 clfjyimg.png 准确度最高
  let image = path.resolve(__dirname, `./temp/${fileName}.png`);
  image = await reviseImg(image);
  console.log(`Recognizing ${image}`);
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789-,.:",
    tessedit_char_blacklist: "abcdefghigklmnopqrstuvwxyz",
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
  });
  const {
    data: { text },
  } = await worker.recognize(image);
  console.log(text);
  // TODO: 处理处理后的数据
  // console.log(text.replace(/[\r\n\s]/gm, ''))
  await worker.terminate();
};

ocrImage("clfjyimg");

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
