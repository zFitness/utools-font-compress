import { Button } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload";
import Dragger from "antd/lib/upload/Dragger";
// import { transfer } from "font-carrier";
import { useContext, useState } from "react";
import { FontContext } from "../../context";
import styles from "./index.module.css";

interface Props {
  onChange: (fontFile: UploadFile, fontBuffer: ArrayBuffer | null) => void;
}

const ExportBtn: React.FC<Props> = ({ onChange }) => {
  const fontParam = useContext(FontContext);
  const handleOnChange = (e: UploadChangeParam<UploadFile<any>>) => {
    console.log(e);
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const result = fileReader.result as ArrayBuffer;
      console.log(result);
      onChange(e.file, result);
      const font = new FontFace("Custom", result);
      document.fonts.add(font);
      font.load();
      font.loaded
        .then(() => {})
        .catch((err) => {
          console.log(err);
        });
    };
    fileReader.readAsArrayBuffer(e.file.originFileObj!);
  };

  const handleExport = () => {
    if (fontParam.fontFile) {
      console.log(window.compress);
      console.log(fontParam.fontFile);
      const path = fontParam.fontFile?.originFileObj?.path;
      const newPath = path.split(".")[0] + "_min";
      window.compress(fontParam.fontBuffer, fontParam.text, newPath, fontParam.types);
    }
  };

  return (
    <div className={styles.btnWrapper}>
      <Dragger
        className={styles.draggerWrapper}
        showUploadList={false}
        onChange={handleOnChange}
      >
        {fontParam.fontFile ? (
          fontParam.fontFile.name
        ) : (
          <p className="ant-upload-drag-icon">点击或拖动上传字体(*.ttf)</p>
        )}
      </Dragger>
      <Button type="primary" disabled={!fontParam.fontFile} className={styles.btn} onClick={handleExport}>
        导出
      </Button>
    </div>
  );
};

export default ExportBtn;
