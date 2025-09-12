const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dv19l9qkz',
  api_key: '758661918223334',
  api_secret: 'EMixlJsD7o4IOgvESs2pyN2NXYU',
});


function getPublicIdFromUrl(url) {
  const urlParts = url.split('/');
  const filenameWithExt = urlParts.at(-1); // zcfvxf59wgjyfiw4s2b7.png
  const folder = urlParts.at(-2);          // utilisateurs
  const [filenameWithoutExt] = filenameWithExt.split('.');
  return `${folder}/${filenameWithoutExt}`; // utilisateurs/zcfvxf59wgjyfiw4s2b7
}
module.exports = {cloudinary, getPublicIdFromUrl};
