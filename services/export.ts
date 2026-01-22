import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";


export const downloadAsDocx = async (filename: string, content: string) => {
 
  const cleanContent = content.split('【递增式全量剧情总结】')[0];
  const lines = cleanContent.split('\n');

  // 2. 创建文档段落
  const paragraphs = lines.map(line => {
    return new Paragraph({
      spacing: {
        line: 360, // 1.5倍行距，让剧本阅读更清晰
      },
      children: [
        new TextRun({
          text: line,
          size: 24, // 12号字（小四）
          font: "Microsoft YaHei", // 微软雅黑
        }),
      ],
    });
  });

  // 3. 构建 Word 结构
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: paragraphs,
    }],
  });

  // 4. 打包并触发下载
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};
