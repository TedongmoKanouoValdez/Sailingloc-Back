const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dluqkutu8',
  api_key: '946644823717511',
  api_secret: 'O-jrBhybr0d4aI_savipkzyKtpE',
});


function getPublicIdFromUrl(url) {
  const urlParts = url.split('/');
  const filenameWithExt = urlParts.at(-1); // zcfvxf59wgjyfiw4s2b7.png
  const folder = urlParts.at(-2);          // utilisateurs
  const [filenameWithoutExt] = filenameWithExt.split('.');
  return `${folder}/${filenameWithoutExt}`; // utilisateurs/zcfvxf59wgjyfiw4s2b7
}
module.exports = {cloudinary, getPublicIdFromUrl};
