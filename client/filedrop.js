var log, nbFiles, MK = window.MK = window.MK || {};

MK.fileUploader = {
  dragHover: function (e) {
    e.stopDefault();
    (e.type == "dragover") ? $(this).addClass('hover') : $(this).removeClass('hover');
  },
  handleFile: function (e) {
    // cancel event and hover styling
    MK.fileUploader.dragHover(e);
    var files = e.target.files || e.dataTransfer.files;
    nbFiles = files.length;
    log = {};
    $('.loading').removeClass('hide');
    // process all File objects
    for (var i = 0, f; f = files[i]; i++) {
      log[f.name] = f;
      processFile(f);
    }
  }
};

function processFile (file) {
  console.log(
    "File information: " + file.name +
      " type: " + file.type +
      " size: " + file.size +
      " bytes"
  );
  try {
    MK.model.validateFile(file);
  }
  catch (err) {
    log[file.name].error = err;
    cb(err, file.name);
    return;
  }
  // TODO: remove parseFile and upload durectly
  parseFile(file);
}

function parseFile (file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    console.log(
      file.name + ": " +
        e.target.result
    );
//    file.data = e.target.result;
    // TODO: use namespace as key, do only once for all files
    Meteor.call("getS3Token", file.name, function (err, creds) {
      log[file.name].error = err;
      if (err) cb(err, file.name);
      else uploadFile(file, creds)
    });
  };
  reader.onerror = function (e) {
   debugger;
    cb(err, file.name);
  };
  reader.readAsDataURL(file);
}

function uploadFile (file, creds, cb) {
  // TODO: browser handling
  var xhr = new XMLHttpRequest();
  if (xhr.upload) {
    // create form data
    var fd = new FormData();

    fd.append('key', file.name);
    fd.append('acl', 'public-read');
    fd.append('Content-Type', file.type);
    fd.append('AWSAccessKeyId', creds.s3Key);
    fd.append('policy', creds.s3PolicyBase64)
    fd.append('signature',creds.s3Signature);

    fd.append("file",file);

    // create progress bar
    var o = $id("progress");
    var progress = o.appendChild(document.createElement("p"));
    progress.appendChild(document.createTextNode("upload " + file.name));

    // progress bar
    xhr.upload.addEventListener("progress", function (e) {
      var pc = parseInt(100 - (e.loaded / e.total * 100));
      progress.style.backgroundPosition = pc + "% 0";
    }, false);

    // file received/failed
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === 4) {
        progress.className = (xhr.status >= 200 && xhr.status < 300 ? "success" : "failure");

      }
    };

    xhr.onerror = function (e) {
      console.log(e);
     };

    // start upload
    // TODO remove $id method
    xhr.open("POST", $id("upload").action, true);
    xhr.setRequestHeader("X_FILENAME", file.name);
    xhr.send(fd);
    } else {
    throw new Error('Upload not supported');
  }

}

function $id (id) {
  return document.getElementById(id);
}

function cb (err, fileName, data) {
  log[fileName].error = err;
  log[fileName].data = data;
  if (! err) MK.app.info('Finished downloading ' + fileName);
  else console.log('Error downloading ' + fileName + '\n' + err);
//  else MK.app.error('Error downloading ' + fileName + '<br>' + err);
  if (--nbFiles <= 0) {
    $('.loading').addClass('hide');
    setTimeout(function () {
      MK.app.info('All files downloaded.');
    }, 5000);
  }
}