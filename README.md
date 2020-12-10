# xiamen-housing-data-collection

利用 Github Actions 定时采集厦门市住房保障与房屋管理局的二手房网签情况

## OCR, 光学字符识别

> 光学字符识别（英語：Optical Character Recognition，OCR）是指对文本资料的图像文件进行分析识别处理，获取文字及版面信息的过程。

这里我们使用使用 `Tesseract`, 读取和处理从图像中提取的文本。市面上很多云服务商有提供OCR服务, 其中实验了下, 腾讯云的OCR精度非常满意, 但毕竟都是有偿使用的, 对于这个项目而言, 用免费的足矣。

- Install Tesseract

  `brew install --with-training-tools tesseract`

- Install Tesseract library for Node.js: [tesseract.js](https://github.com/naptha/tesseract.js)

  `npm i tesseract.js`

> 这一款由 HP 实验室开发由 Google 维护的开源 OCR 引擎，特点是开源，免费，支持多语言，多平台。

### 提高 OCR 精度

#### 对图片进行预处理

- Install ImageMagick

  `brew install graphicsmagick`

- Install ImageMagick Library for Node.js: [gm](https://github.com/aheckmann/gm)

  `npm i gm`

- 二值化与提高DPI

  使用 `threshold` 处理图片，是去掉噪声，比如黑点或者颜色。

  > 简单理解就是把图片转换成黑白

  `tesseract` 默认dpi是300，最好把图片的dpi设置为300

  > 关于 sample/resample/scale/resize/adaptive-resize/thumbnail 有什么区别
  >
  > ref to [StackOverflow](https://stackoverflow.com/questions/8517304/what-is-the-difference-for-sample-resample-scale-resize-adaptive-resize-thumbnai)

  `-resample` uses as parameter the desired `XxY` resolution, not not the `XxY` pixel geometry of the target image. The purpose of this operator is to preserve the rendered size of an image: Assume your image measures 4 inches by 3 inches on a device that renders it at 300 DPI. Then asking for a `-resample 72` or -resample 72x72 will resize the image so that it measures (again) 4 inches by 3 inches on a 72 DPI device.

  也就是利用 `resample`会重新计算特定dpi下的像素比

  在代码中处理如下

  ```js
  gm(src)
    .resample(300, 300)
    .flatten()
    .threshold(22, "%")
    .write(output, (err) => (err ? reject(err) : resolve(output)));
  ```

- 设置白名单

  如果只想识别语料库中的一部分字符，比如只需要识别数字，则可以设置 `tessedit_char_whitelist` 参数。

### 词库训练

TODO: 项目只提取数字, 暂时没涉足这块区域

## GitHub Actions

TODO:
