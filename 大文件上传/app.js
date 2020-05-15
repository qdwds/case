const express = require('express');
const bodyParser = require('body-parser')
//  文件上传模块  处理上传文件
const multiparty = require('multiparty')
const fse = require('fs-extra');
const fs = require('fs')
const path = require('path')
const app = express();
app.use(express.static(__dirname + '/public'))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

//  定义文件存放目录
const UPLOAD_DIR = path.resolve(__dirname, 'public/upload')
app.post('/maxUpload', (req, res) => {
  //  上传到temp地址
  const form = new multiparty.Form({ uploadDir: "temp" })
  form.parse(req);
  //  上传成功后触发
  form.on('file', async (name, chunk) => {
    //  存放切片目录
    let chunkDir = `${UPLOAD_DIR}/${chunk.originalFilename.split('.')[0]}`
    // 文件的具体地址
    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir)
    }

    //  原文件名.index.ext
    let dPath = path.join(chunkDir, chunk.originalFilename.split('.')[1])
    await fse.move(chunk.path, dPath, { overwrite: true })
    res.send('文件上传成功')

  })
})

//  合并分片目录
app.post('/merge', async function (req, res) {
  //  上传的文件全名称
  let name = req.body.name;
  // 文件名称 不包括后缀名
  let fname = name.split('.')[0];

  let chunkDir = path.join(UPLOAD_DIR, fname)
  let chunks = await fse.readdir(chunkDir)

  chunks.sort((a, b) => a - b).map(chunkPath => {
    fs.appendFileSync(
      path.join(UPLOAD_DIR, name),
      fs.readFileSync(`${chunkDir}/${chunkPath}`)
    )
  })
  //  删除原来目录
  fse.removeSync(chunkDir);
  res.send({ msg: '合并成功', url: `http://localhost:3000/upload/${name}` })
})



app.post('/upload', (req, res) => {
  //  上传到temp地址
  const form = new multiparty.Form({ uploadDir: "temp" })
  form.parse(req);
  //  上传成功后触发
  form.on('file', () => {
    res.send('文件上传成功')
  })
})
app.listen(3000, () => {
  console.log(3000);
})