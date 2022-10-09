const fontCarrier = require("zm-font-carrier");
// const fontCarrier = require("font-carrier");

/**
 *
 * @param {ArrayBuffer} fontFile
 * @param {string} text
 */
window.compress = (
  fontFile,
  text,
  path,
  types = ["eot", "svg", "ttf", "woff"]
) => {
  if (!fontFile || !text) {
    console.error("字体文件或文字不能为空");
    return;
  }
  const font = fontCarrier.transfer(Buffer.from(fontFile));
  font.min(text);
  console.log(text);

  const bufferList =
    font.output({
      path,
      types,
    }) || [];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const buffer = bufferList[i];
    const arrayBuffer = new Int8Array();
  }
};
