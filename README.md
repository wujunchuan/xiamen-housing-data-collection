# xiamen-housing-data-collection

![Publish Docker image](https://github.com/wujunchuan/xiamen-housing-data-collection/workflows/Publish%20Docker%20image/badge.svg)

> Emm..这个厦门市住房管理局服务器好像屏蔽了美国的 IP, 至少我在 CI 中和挂美国服务器的代理都访问不了,所以利用 `GitHub Actions` 来白嫖算力的计划行不通了.
>
> 不过仍然可以将项目部署在国内, 创建 `cron` 定时任务,然后`commit`、`push`到仓库
>
> 不过我不想折腾这个,需要的可以自行去研究.(我只是想用下 GitHub Actions 练练手)

利用 ~~Github Actions~~ 定时采集厦门市住房保障与房屋管理局的二手房网签情况

## Build with Docker

项目用 [GitHub Action](.github/workflows/docker-image.yml) 进行打包, 镜像托管在 [Github Packages](https://github.com/wujunchuan/xiamen-housing-data-collection/packages/538417/versions)

关于手动部署

- build image

  `docker build -t docker.pkg.github.com/wujunchuan/xiamen-housing-data-collection/<IMAGE_NAME>:<VERSION> .`

- push image
  `docker push docker.pkg.github.com/wujunchuan/xiamen-housing-data-collection/<IMAGE_NAME>:<VERSION>`

## Use Docker

[Docker 镜像](Dockerfile)**包含**环境依赖(`graphicsmagick`...),可直接运行

- clone this project

  `git clone git@github.com:wujunchuan/xiamen-housing-data-collection.git`

- cd project folder

  `cd ./xiamen-housing-data-collection`

- download and run docker the image

  `docker run -it --rm -v $(pwd)/raw:/usr/src/nodejs/raw --name xiamen-housing-data-collection docker.pkg.github.com/wujunchuan/xiamen-housing-data-collection/app:main`

## OCR, 光学字符识别

> 光学字符识别(英語:Optical Character Recognition,OCR)是指对文本资料的图像文件进行分析识别处理,获取文字及版面信息的过程.

这里我们使用使用 `Tesseract`, 读取和处理从图像中提取的文本.市面上很多云服务商有提供 OCR 服务, 其中实验了下, 我对腾讯云的 OCR 精度最满意.但这些毕竟都是有偿使用的, 对于这个项目而言, 自己动手丰衣足食.

> `Tesseract` 由 HP 实验室开发由 Google 维护的开源 OCR 引擎,特点是开源,免费,支持多语言,多平台.

- Install Tesseract

  `brew install --with-training-tools tesseract`

- Install Tesseract library for Node.js: [tesseract.js](https://github.com/naptha/tesseract.js)

  `npm i tesseract.js`

- 下载语言包模型

  移步 https://github.com/tesseract-ocr/tessdata

### 提高 OCR 精度

直接使用 `Tesseract` 对图片进行识别, 有点惨不忍睹, 数字都识别不清不楚的.这肯定是不能忍的, 毕竟咱们主要就是要解析图片上的数字,加以处理并归纳记录.

#### 对图片进行预处理

- Install ImageMagick

  `brew install graphicsmagick`

- Install ImageMagick Library for Node.js: [gm](https://github.com/aheckmann/gm)

  `npm i gm`

- 二值化与提高 DPI

  使用 `threshold` 处理图片,是去掉噪声,比如黑点或者颜色.

  > 简单理解就是把图片转换成黑白

  `tesseract` 默认 dpi 是 300,最好把图片的 dpi 设置为 300

  > 关于 sample/resample/scale/resize/adaptive-resize/thumbnail 有什么区别
  >
  > ref to [StackOverflow](https://stackoverflow.com/questions/8517304/what-is-the-difference-for-sample-resample-scale-resize-adaptive-resize-thumbnai)

  `-resample` uses as parameter the desired `XxY` resolution, not not the `XxY` pixel geometry of the target image. The purpose of this operator is to preserve the rendered size of an image: Assume your image measures 4 inches by 3 inches on a device that renders it at 300 DPI. Then asking for a `-resample 72` or -resample 72x72 will resize the image so that it measures (again) 4 inches by 3 inches on a 72 DPI device.

  也就是利用 `resample`会重新计算特定 dpi 下的像素比

  在代码中处理如下

  ```js
  gm(src)
    .resample(300, 300)
    .flatten()
    .threshold(22, "%")
    .write(output, (err) => (err ? reject(err) : resolve(output)));
  ```

#### Tesseract 配置

- 设置白名单

  如果只想识别语料库中的一部分字符,比如只需要识别数字,则可以设置 `tessedit_char_whitelist` 参数.

- 词库训练

  _项目只提取数字, 暂时没涉足这块区域_

  > 如果要进行中文识别的话, 就需要折腾这一块内容了,官方提供训练好的库不好使.

##### 参考

- [Improving the quality of the output](https://tesseract-ocr.github.io/tessdoc/ImproveQuality)

## License

[xiamen-housing-data-collection](https://github.com/wujunchuan/xiamen-housing-data-collection) 的源码使用 MIT License 发布.具体内容请查看 [LICENSE](./LICENSE) 文件.
