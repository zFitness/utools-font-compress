import { UploadFile } from "antd";
import { FontType } from "font-carrier/class/font";

export interface FontParam {
  text: string;
  fontFile: UploadFile | null;
  fontBuffer: ArrayBuffer | null;
  types: FontType[]
}
