import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export const downloadAsDocx = async (filename: string, content: string) => {

  const cleanContent = content.split('【递增式全量剧情总结】')[0];
  const lines = cleanContent.split('\n');

  const paragraphs = lines.map(line => {
    return new Paragraph({

      children: [
        new TextRun({
          text: line,

          font: "Microsoft YaHei", 
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [{
      properties: {
        // 【修改】去掉页边距设置，使用 Word 默认页边距
      },
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};
