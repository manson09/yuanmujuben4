import { OpenAI } from "openai";

const ai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  baseURL: import.meta.env.VITE_BASE_URL,
  dangerouslyAllowBrowser: true, 
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Script Matrix Agent", 
  }
});

export const generateOutline = async (novel: string, styleRef: string, formatRef: string, mode: 'male' | 'female') => {
  const prompt = `
    任务：你是一位顶级的动漫爽剧架构师。请深度分析原著内容，制定一份精准的【分集执行地图】。
    当前模式：【${mode === 'male' ? '男频：热血升级、爆爽打脸、极致节奏' : '女频：重生复仇、虐渣逆袭、情感拉扯'}】
    【核心铁律】：
    1. **集数总量**：必须规划出 70-85 集的内容。
    2. **单集容量**：每集对应 2-3 分钟影视内容，严禁注水。
    3. **章节对齐**：必须精准标注每一集对应的原著章节，禁止凭空捏造原著没有的情节。
    4. **风格锁定**：按【${mode === 'male' ? '男频' : '女频'}】爽剧节奏，每集结尾必须有强力反转或钩子。
    
    【！！！输出格式强制要求！！！】：
    【START_MAP】
    第1阶段：[1-6]集，原著【1-12】章节，
    - 第1集：对应原著第1-2章，爽点：[描述原著中的冲突/爽点]
    - 第2集：对应原著第3章...
    ...
    第2阶段：[7-15]集，原著【13-25】章节...
    - 第7集：对应原著第13-14章...
    【END_MAP】
        【核心逻辑要求】：
    1. **动态密度分析**：不要机械地划分章节。
       - 情节高潮、反转密集的章节，请放慢节奏（例如：原著1章对应剧本1集）。
       - 铺垫较多、注水严重的章节，请大幅度压缩（例如：原著5-8章压缩成剧本1集）。
    2. **全量覆盖**：必须覆盖原著提供的所有核心剧情，总集数最终控制在 70-85 集左右。

    【输出格式要求（这是系统解析的唯一标准）】：
    请务必将规划内容包裹在 【START_MAP】 和 【END_MAP】 之间。
    （以下数字仅为格式示例，请根据原著实际篇幅和密度自行分配）

    【核心禁令】：
    1. 严禁跳过原著关键情节。
    2. 每一集的原著指向必须极其精确，这是后续生成脚本的唯一依据。
    
    【待分析原著内容】：
    ${novel}

    【排版/文笔参考】：
    排版标准：${formatRef || '标准剧本格式'}
    文笔风格：${styleRef || '快节奏、高张力'}

  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-pro-preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};

/**
 * 第二部分：剧情脚本功能（地图精准执行者）
 */
export const generateScriptPhase = async (novel: string, outline: string, currentPhasePlan: string, cumulativeSummary: string, styleRef: string, formatRef: string, mode: 'male' | 'female', phaseIndex: number) => {
  const prompt = `
    任务：你是顶级剧本主笔。现在请执行【第${phaseIndex}阶段】的全量脚本创作。
    当前爽剧模式：【${mode === 'male' ? '男频（热血、升级、爆爽打脸）' : '女频（重生、复仇、极致拉扯）'}】

    【唯一执行地图（本阶段分集对照表）】：
    ${currentPhasePlan}

    【！！！最高执行准则！！！】：
    1. **全量输出**：你必须一口气生成上述地图中【所有集数】的脚本内容（例如第7集到第15集）。
    2. **章节对齐**：
       - 严禁从第一章重新开始！
       - 严格按照地图指令：若地图说“第8集对应原著第14章”，你写第8集时【只能】参考第14章内容。
    3. **剧情衔接**：
       - 历史剧情进度回顾：${cumulativeSummary || '这是全剧开篇'}。
       - 紧接上文，直接进入本阶段第一集的剧情，严禁注水、严禁重复交代。
    4. **模式化创作**：
       - 删掉原著中平淡的描写，用【${mode === 'male' ? '男频' : '女频'}】的快节奏影视化语言扩写。
       - 确保每一集结尾都有一个强力“钩子”吸引观众看下一集。
    5. 【高信息量还原】：
       - 剔除“呜呜”、“嘤嘤”、“桀桀”等网文废词。
       - 确保单集时长撑满 2-3 分钟，信息密度极高。

    【原著小说内容全量库】：
    ${novel}
    【排版参考内容（你的唯一标准）】：
    ${formatRef || '按标准剧本格式，无特殊符号'}
    【输出格式要求】：
    1. 严格按照参考排版输出每一集。
    【最后一行强制输出】：
    【递增式全量剧情总结】：(请在此总结从第1集到本阶段最后一集的所有核心剧情，字数限制在300字内，用于下一阶段衔接)。
  `;
  const response = await ai.chat.completions.create({
    model: "google/gemini-3-pro-preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

/**
 * 第三部分：脚本润色
 */
export const polishScript = async (
  originalScript: string,
  kbContext: string
) => {
  const prompt = `
    你是一位专业的剧本精修师。请对以下剧情脚本进行“去AI化”处理。
    保证剧情一致性，优化自然语言，删除AI常用平庸词汇。
    知识库：${kbContext}

    待处理内容：
    ${originalScript}
  `;

  const response = await ai.chat.completions.create({
    model: "google/gemini-3-flash-Preview", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
};
