/*
 * @Author: John Trump
 * @Date: 2020-12-09 19:42:28
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-11 17:39:44
 */
const cheerio = require("cheerio");
/* https://www.npmjs.com/package/tesseract.js */
const { createWorker, PSM } = require("tesseract.js");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
const gm = require("gm");
const dayjs = require("dayjs");
const { promisify } = require("util");

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
const fetchImage = (path, baseUrl = URL) => {
  return new Promise(async (resolve) => {
    let fileName = path.split("/")[2] || "unknown";
    const response = await axios.get(`${baseUrl}${path}`, {
      responseType: "stream",
    });

    /* remove random stamp */
    fileName = fileName.replace(/(\?id=\-?\w+)/gm, "");

    response.data
      .pipe(fs.createWriteStream(`temp/${fileName}.png`))
      .on("finish", () => {
        resolve(fileName);
      });
  });
};

/** 对图片进行处理, 以便可以 tesseract 可以更好的识别图片 */
const reviseImg = (src) => {
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
const ocrImage = (fileName) => {
  // 一手房分区情况 spfjsimg.png
  // 一手房整体情况 spftjimg.png
  // 二手房备案情况 clfjyimg.png
  return new Promise(async (resolve, reject) => {
    try {
      let image = path.resolve(__dirname, `./temp/${fileName}.png`);
      try {
        image = await reviseImg(image);
      } catch (err) {
        console.log(err);
      }
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
      resolve(text);
    } catch (error) {
      reject(error);
    } finally {
      await worker.terminate();
    }
  });
};

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

/**
 * Merge record, 根据日期去重
 * @param {array} older
 * @param {array} newer
 */
const mergeRecord = (older, newer) => {
  const obj = {};

  for (const item of older.concat(newer)) {
    obj[item.dateTime] = { ...item };
  }

  return Object.entries(obj).map(([dateTime, other]) => ({
    dateTime,
    ...other,
  }));
};

/** 结果写入json */
const writeToJSON = async (record) => {
  const yyyyMM = dayjs(new Date()).format("YYYY-MM");
  const fullPath = path.join("raw", `${yyyyMM}.json`);
  let records = [];
  // if exist, parse json to object
  if (await fs.existsSync(fullPath)) {
    const context = await promisify(fs.readFile)(fullPath);
    records = JSON.parse(context);
  }
  /* MergeRecord */
  records = mergeRecord(records, [{ ...record }]);
  // write to file
  await promisify(fs.writeFile)(fullPath, JSON.stringify(records, '', 2));
};

/** 入口 */
async function main() {
  /* fetch html */
  const { data: html } = await axios.get(URL);
  const promises = [];
  const $ = cheerio.load(html);

  /* fetch images[] */
  $(".imgcontainer img").each(function(i) {
    const src = $(this).attr("src");
    promises.push(fetchImage(`${src}`));
  });

  /* fetch image data */
  const results = await Promise.all(promises);
  const text = await ocrImage(results[2]);
  const parsed_clfjyimg = parse_clfjyimg(text);

  /* write to file */
  writeToJSON(parsed_clfjyimg);
}

main();

// module.exports = main;
