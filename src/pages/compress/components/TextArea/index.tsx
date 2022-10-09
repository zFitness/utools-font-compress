import { Divider, Typography, Input } from "antd";
import { useContext } from "react";
import { FontContext } from "../../context";
import styles from "./index.module.css";

const { Text } = Typography;
const AntdTextArea = Input.TextArea;

interface Props {
  onChange: (v: string) => void;
}

const TextArea: React.FC<Props> = ({ onChange }) => {
  const fontParam = useContext(FontContext);
  return (
    <div className={styles.text}>
      <div className={styles.title}>
        <span>Ant Design (success)</span>
        <span>Ant Design (success)</span>
      </div>
      <Divider className={styles.divider} />
      <AntdTextArea
        className={styles.textarea}
        bordered={false}
        placeholder="输入文本进行字体子集化"
        autoSize
        value={fontParam.text}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TextArea;
