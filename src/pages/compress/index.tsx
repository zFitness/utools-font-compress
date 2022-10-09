import styles from "./index.module.css";
import { Checkbox, Divider, Typography } from "antd";
import { useState } from "react";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import TextArea from "./components/TextArea";
import ExportBtn from "./components/ExportBtn";
import { FontContext } from "./context";
import { FontParam } from "./types";
import { FontType } from "font-carrier/class/font";

const plainOptions: FontType[] = ["eot", "svg", "ttf", "woff"];
const defaultCheckedList: FontType[] = ["eot", "svg", "ttf", "woff"];
const CheckboxGroup = Checkbox.Group;

const { Text } = Typography;

const Compress = () => {
  const [fontParam, setFontParam] = useState<FontParam>({
    text: "",
    fontFile: null,
    fontBuffer: null,
    types: defaultCheckedList,
  });

  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);

  const onChange = (list: CheckboxValueType[]) => {
    setFontParam({
      ...fontParam,
      types: list as FontType[],
    });
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setFontParam({
      ...fontParam,
      types: e.target.checked ? plainOptions : []
    });
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };
  return (
    <FontContext.Provider value={fontParam}>
      <div className={styles.page}>
        <div className={styles.left}>
          <TextArea
            onChange={(text) => {
              setFontParam({
                ...fontParam,
                text,
              });
            }}
          />
          <Divider className={styles.divider} />
          <div className={styles.formControl}>
            <div className={styles.fontCheck}>
              <Checkbox
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
              >
                所有
              </Checkbox>
              <CheckboxGroup
                options={plainOptions}
                value={fontParam.types}
                onChange={onChange}
              />
            </div>
            <ExportBtn
              onChange={(fontFile, fontBuffer) =>
                setFontParam({
                  ...fontParam,
                  fontBuffer,
                  fontFile,
                })
              }
            />
          </div>
        </div>
        <div className={styles.right}>
          <Text type="secondary">转换后的文字</Text>
          <div
            style={{
              fontFamily: fontParam.fontFile ? "Custom" : undefined,
            }}
          >
            {fontParam.text}
          </div>
        </div>
      </div>
    </FontContext.Provider>
  );
};

export default Compress;
