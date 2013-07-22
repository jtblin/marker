if (process.env.NODE_ENV === 'sample') {
  MK = Meteor.MK = Meteor.MK || {};

  MK.config = {
    "s3": {
      accessKey: 'AKIAIXIFBUI3V3VGAVVA',
      secretKey: '<secret_key>',
      bucket: 'aag-tests',
      acl: 'public-read',
      maxFileSize: 1024*1024*10
    }
  };
}