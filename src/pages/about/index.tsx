import { Typography } from "antd";
import Link from "antd/lib/typography/Link";
import img from "../../../public/logo.png";
import styles from "./index.module.css";

const { Title, Text } = Typography;
const AboutPage = () => {
  return (
    <div className={styles.page}>
      <div>
        <img src={img} width={50} />
        <Title level={4}>字体压缩</Title>
        <div>
          <Text>Version: 1.0</Text>
        </div>
        <div>
          <Text>Author: zfitness</Text>
        </div>
        <div>
          <Text>Github: <Link href="https://github.com/zFitness/utools-font-compress">https://github.com/zFitness/utools-font-compress</Link></Text>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
