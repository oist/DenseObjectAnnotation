const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const fs = require('fs');
const sizeOf = require('image-size');


const app = express();
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({limit: '200mb', extended: true}));
app.use(bodyParser.json({limit: '200mb'}));

const imageFolder = 'static/png/';
const labelFolder = 'static/txt/';

app.get('/',function(req,res) {
     res.sendFile(path.join(__dirname+'/annotate.html'));
});

app.listen(3000, () => console.log('Annotation app listening on port 3000'));

app.post('/saveData', function(req, res){
    const post_body = req.body;

    fs.writeFile(labelFolder + post_body.filename, post_body.message, (err) => {
        if (err) throw err;
        console.log('saved ' + post_body.filename)
    });
    res.end()
});

app.post('/savePreview', function(req, res){
    const post_body = req.body;
    const previewFolder = 'static/preview/';

    if (!fs.existsSync(previewFolder)){
        fs.mkdirSync(previewFolder);
    }
    const imageData = post_body.data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = new Buffer(imageData, 'base64');
    fs.writeFile(previewFolder + post_body.filename, buffer, (err) => {
        if (err) throw err;
        console.log('saved ' + post_body.filename)
    });
    res.end()
});

app.get('/listFiles', function (req, res) {
    fs.readdir(imageFolder, function(err, items) {
        items.forEach(function(filename, index, arr) {
            arr[index] = path.parse(filename).name;
        });
        return res.json(items)
    });
});

app.get('/getImageSize', function (req, res) {
    const imagePath = imageFolder + req.query.frameName;
    sizeOf(imagePath, function (err, dimensions) {
        return res.json(dimensions)
    });
});